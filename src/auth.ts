// src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import getProviders from "@/app/api/auth/providers"; // your factory
import type { Role, Theme } from "@prisma/client";
import type { User } from "next-auth";

// ---------- Early sanity checks ----------
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
    throw new Error("Missing NEXTAUTH_SECRET — refusing to start in production.");
}
if (!process.env.NEXTAUTH_SECRET) {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.warn("[next-auth] NEXTAUTH_URL is not set. Set it to your site origin.");
}

// ---------- tiny type guards/utilities ----------
function hasId(u: unknown): u is { id: string } {
    return typeof u === "object" && u !== null && "id" in u && typeof (u as any).id === "string";
}
function setTokenTheme(token: unknown, theme: Theme) {
    (token as Record<string, unknown>).theme = theme;
}
function getTokenTheme(token: unknown): Theme | undefined {
    return (token as Record<string, unknown>).theme as Theme | undefined;
}
function hasTokenTheme(token: unknown): boolean {
    return typeof (token as Record<string, unknown>).theme !== "undefined";
}

// ---------- v5: single entrypoint ----------
export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    // Prisma + your provider list
    adapter: PrismaAdapter(prisma),
    providers: getProviders(),

    // Keep JWT sessions (your code expects it)
    session: { strategy: "jwt" },

    // v5 still accepts this
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },

    callbacks: {
        /**
         * Runs on sign-in, and whenever you call session.update() (trigger === 'update'),
         * and periodically on requests (per NextAuth’s rotation strategy).
         */
        async jwt({ token, user, account, trigger, session }) {
            // keep user id on token
            if (user && hasId(user)) token.id = user.id;

            // reflect client-side session.update({ theme }) into the token
            if (trigger === "update" && session?.theme) {
                setTokenTheme(token, session.theme as Theme);
            }

            // ensure role/username/theme are sourced from DB unless already present
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
                    // fallback default theme when we can't resolve a user
                    if (!hasTokenTheme(token)) setTokenTheme(token, "light" as Theme);
                }
            }

            // remember last OAuth provider (convenience only)
            if (account?.provider) (token as any).lastProvider = account.provider;

            return token;
        },

        /**
         * Shape the session sent to the client (and available to server via auth()).
         */
        async session({ session, token }) {
            if (session.user) {
                if (token.id) (session.user as any).id = token.id as string;
                if (token.role) (session.user as any).role = token.role as Role;
                if (typeof token.username !== "undefined") {
                    (session.user as any).username = (token.username as string | null) ?? null;
                }
                (session.user as any).theme = getTokenTheme(token) ?? "light";
            }
            return session;
        },
    },

    /**
     * Event hooks — keep your defaults bootstrap.
     */
    events: {
        async createUser({ user }) {
            const email = (user as Pick<User, "email">).email ?? null;
            const baseName = email ? email.split("@")[0] : user.name ?? `user_${user.id.slice(0, 8)}`;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "VIEWER",
                    username: baseName,
                    // theme stays DB default (e.g., 'light')
                },
            });
        },
        async signIn({ user, account }) {
            // eslint-disable-next-line no-console
            console.log(`User ${user.id} signed in with provider ${account?.provider}`);
        },
        async linkAccount() {
            /* no-op for now */
        },
    },
});
