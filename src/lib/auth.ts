// src/lib/auth.ts
import getProviders from "@/app/api/auth/providers";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, User } from "next-auth";
import type { Role, Theme } from "@prisma/client";
import { NextRequest } from "next/server";
import { fetchSteamPersona } from "./steam";

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

// src/lib/auth.ts
// 🚨 Early env sanity checks — before exporting authOptions
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
    throw new Error("Missing NEXTAUTH_SECRET — refusing to start in production.");
}
if (!process.env.NEXTAUTH_SECRET) {
    console.error(`
========================================================
🚨 NEXTAUTH_SECRET is missing!
JWT session decryption will break across restarts.
Generate one with:  openssl rand -base64 32
Add to .env.local (dev) and your prod environment.
========================================================
`);
}
if (!process.env.NEXTAUTH_URL) {
    console.warn("[next-auth] NEXTAUTH_URL is not set. Set it to your site origin.");
}

export const authOptionsBase: Omit<NextAuthOptions, "providers"> = {
    adapter: PrismaAdapter(prisma),
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
        // async linkAccount() {},
        async linkAccount({ user, account }) {
            if (account?.provider === "steam" && account.providerAccountId) {
                try {
                    const p = await fetchSteamPersona(account.providerAccountId);
                    if (p) {
                        const accountId = account.id as string;
                        // const label
                        await prisma.account.update({
                            where: { id: accountId },
                            data: { label: p.personaname ?? null, image: p.avatarfull ?? p.avatar ?? null },
                        });
                    }
                } catch (e) {
                    console.warn("steam enrichment failed", e);
                }
            }
        },
    },
};

// ✅ Factory that returns FULL options (with providers). Pass req when you have it.
export function getAuthOptions(req?: NextRequest): NextAuthOptions {
    return {
        ...authOptionsBase,
        providers: getProviders(req),
    };
}

// (no req -> Steam falls back to NEXTAUTH_URL; that’s fine for reading sessions)
export const authOptions: NextAuthOptions = getAuthOptions();
