// src/lib/auth.ts
import { credentialsProvider } from "@/app/api/auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
    providers: [credentialsProvider],
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign-in
            if (user) {
                token.role = user.role;
            }

            // Also check database on subsequent requests
            if (!token.role && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { role: true },
                });

                if (dbUser) {
                    token.role = dbUser.role;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token.role) {
                session.user.role = token.role as Role;
            }
            return session;
        },
    },
};
