// src/lib/auth.ts
import getProviders from "@/app/api/auth/providers";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, User } from "next-auth";
import type { Role, Theme } from "@prisma/client";

// Type guard for user with id
function hasId(u: unknown): u is { id: string } {
    return typeof u === "object" && u !== null && "id" in u && typeof (u as { id: unknown }).id === "string";
}

// Small helpers to avoid `any`
function setTokenTheme(token: unknown, theme: Theme) {
    (token as Record<string, unknown>).theme = theme;
}
function getTokenTheme(token: unknown): Theme | undefined {
    return (token as Record<string, unknown>).theme as Theme | undefined;
}
function hasTokenTheme(token: unknown): boolean {
    return typeof (token as Record<string, unknown>).theme !== "undefined";
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: getProviders(),
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },

    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            if (user && hasId(user)) token.id = user.id;

            // Reflect client-side session.update({ theme }) into token
            if (trigger === "update" && session?.theme) {
                setTokenTheme(token, session.theme as Theme);
            }

            // ensure role/username/theme from DB (source of truth)
            const needDb = !token.role || typeof token.username === "undefined" || !hasTokenTheme(token);

            if (needDb) {
                const where = token.id ? { id: token.id as string } : token.email ? { email: token.email as string } : null;

                if (where) {
                    const db = await prisma.user.findUnique({
                        where,
                        select: { role: true, username: true, theme: true },
                    });
                    if (db) {
                        token.role = db.role;
                        token.username = db.username ?? null;
                        setTokenTheme(token, (db.theme ?? "light") as Theme);
                    }
                } else {
                    // fallback default if we couldn't resolve a user
                    if (!hasTokenTheme(token)) {
                        setTokenTheme(token, "light" as Theme);
                    }
                }
            }

            // remember last OAuth provider (convenience only)
            if (account?.provider) token.lastProvider = account.provider;

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                if (token.id) session.user.id = token.id as string;
                if (token.role) session.user.role = token.role as Role;
                if (typeof token.username !== "undefined") {
                    session.user.username = (token.username as string | null) ?? null;
                }
                // expose theme to session so layout SSR can use it
                session.user.theme = getTokenTheme(token) ?? "light";
            }
            return session;
        },
    },

    events: {
        async createUser({ user }) {
            const email = (user as Pick<User, "email">).email ?? null;
            const baseName = email ? email.split("@")[0] : user.name ?? `user_${user.id.slice(0, 8)}`;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "VIEWER",
                    username: baseName,
                    // leave theme as DB default ('light') or whatever you set in Prisma
                },
            });
        },
        async signIn({ user, account }) {
            console.log(`User ${user.id} signed in with provider ${account?.provider}`);
        },
        async linkAccount() {},
    },
};
