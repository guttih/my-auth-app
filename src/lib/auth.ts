// src/lib/auth.ts
import { credentialsProvider } from "@/app/api/auth/providers/credentials";
import azure from "@/app/api/auth/providers/azure-ad";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [credentialsProvider, azure()],
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },

    callbacks: {
        async jwt({ token, user, account }) {
            // On first sign-in, copy DB-driven fields into the JWT
            if (user) {
                // @ts-expect-error: custom field
                token.id = user.id;
                // If user came from DB (adapter), it may already have role/username
                // Fallback to a DB fetch only if needed.
                if (!("role" in token)) {
                    const db = await prisma.user.findUnique({
                        where: user.email ? { email: user.email } : { id: (user as any).id },
                        select: { role: true, username: true, authProvider: true },
                    });
                    if (db) {
                        // @ts-expect-error custom fields
                        token.role = db.role;
                        // @ts-expect-error
                        token.username = db.username ?? user.name ?? null;
                        // @ts-expect-error
                        token.authProvider = db.authProvider;
                    }
                }
            }

            // If role still missing (subsequent JWT refresh), keep your original fallback:
            if (!("role" in token) && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                    select: { role: true, username: true, authProvider: true },
                });
                if (dbUser) {
                    // @ts-expect-error
                    token.role = dbUser.role;
                    // @ts-expect-error
                    token.username = dbUser.username ?? null;
                    // @ts-expect-error
                    token.authProvider = dbUser.authProvider;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                // @ts-expect-error
                if (token.id) session.user.id = token.id as string;
                // @ts-expect-error
                if (token.role) session.user.role = token.role as Role;
                // @ts-expect-error
                if (token.username) session.user.username = token.username as string | null;
                // @ts-expect-error
                if (token.authProvider) session.user.authProvider = token.authProvider as "LOCAL" | "AD";
            }
            return session;
        },
    },

    events: {
        // Runs only when a new DB user is created by the adapter (first OAuth sign-in)
        async createUser({ user }) {
            // Set your defaults & derived fields here
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: (user as any).role ?? "VIEWER",
                    authProvider: (user as any).authProvider ?? "AD",
                    // Prefer a stable username: before you add Google, consider a generator if needed
                    username: (user as any).username ?? user.email?.split("@")[0] ?? user.name ?? `user_${user.id.slice(0, 8)}`,
                    // theme/profileImage: set defaults if you want
                    // theme: 'light',
                    // profileImage: user.image ?? null,
                },
            });
        },
    },
};
