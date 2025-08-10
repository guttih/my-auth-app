// src/lib/auth.ts
import getProviders from "@/app/api/auth/providers";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, User } from "next-auth";
import type { Role } from "@prisma/client";

// Type guard for user with id
function hasId(u: unknown): u is { id: string } {
    return typeof u === "object" && u !== null && "id" in u && typeof (u as { id: unknown }).id === "string";
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: getProviders(),
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },

    callbacks: {
        async jwt({ token, user, account }) {
            // seed token.id once
            if (user && hasId(user)) token.id = user.id;

            // ensure role/username from DB (source of truth)
            const needDb = !token.role || typeof token.username === "undefined";
            if (needDb) {
                const where = token.id ? { id: token.id as string } : token.email ? { email: token.email as string } : null;

                if (where) {
                    const db = await prisma.user.findUnique({
                        where,
                        select: { role: true, username: true },
                    });
                    if (db) {
                        token.role = db.role;
                        token.username = db.username ?? null;
                    }
                }
            }

            // Optionally record the last OAuth provider used on this login (not stored in DB)
            if (account?.provider) {
                token.lastProvider = account.provider; // harmless convenience field
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                if (token.id) session.user.id = token.id as string;
                if (token.role) session.user.role = token.role as Role;
                if (typeof token.username !== "undefined") {
                    session.user.username = (token.username as string | null) ?? null;
                }
                // no authProvider on session anymore
            }
            return session;
        },
    },

    events: {
        // brand-new DB user created by OAuth or credentials
        async createUser({ user }) {
            // Build a stable username
            const email = (user as Pick<User, "email">).email ?? null;
            const baseName = email ? email.split("@")[0] : user.name ?? `user_${user.id.slice(0, 8)}`;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "VIEWER",
                    username: baseName,
                },
            });
        },

        // when a signed-in user links a new provider
        async linkAccount() {
            // Linked providers are read live from next-auth Account table.
        },
    },
};
