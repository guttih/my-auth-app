// src/auth.ts
import NextAuth, { type Session, type User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import getProviders from "@/app/api/auth/providers";
import type { Role, Theme } from "@prisma/client";
import { getPlayerSummary } from "@/lib/steam";
import type { JWT } from "next-auth/jwt";

type AppJWT = JWT & {
    id?: string;
    role?: Role;
    username?: string | null;
    theme?: Theme;
    lastProvider?: string;
};

function ensureTheme(t?: Theme): Theme {
    return (t ?? "light") as Theme;
}

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

// ---------- helpers ----------
function hasId(u: Partial<NextAuthUser> | null | undefined): u is { id: string } {
    return typeof u?.id === "string" && u.id.length > 0;
}

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth((req) => ({
    adapter: PrismaAdapter(prisma),
    providers: getProviders(req),
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },

    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            const t = token as AppJWT;

            // keep user id on token
            if (user && hasId(user)) t.id = user.id;

            // reflect client-side session.update({ theme })
            if (trigger === "update" && session && "theme" in session) {
                t.theme = ensureTheme((session as { theme?: Theme }).theme);
            }

            // ensure role/username/theme are sourced from DB unless present
            const missingRole = !t.role;
            const missingUsername = typeof t.username === "undefined";
            const missingTheme = typeof t.theme === "undefined";

            if (missingRole || missingUsername || missingTheme) {
                const where = t.id && typeof t.id === "string" ? { id: t.id } : t.email && typeof t.email === "string" ? { email: t.email } : null;

                if (where) {
                    const db = await prisma.user.findUnique({
                        where,
                        select: { role: true, username: true, theme: true },
                    });
                    if (db) {
                        if (missingRole) t.role = db.role;
                        if (missingUsername) t.username = db.username ?? null;
                        if (missingTheme) t.theme = ensureTheme(db.theme ?? "light");
                    } else if (missingTheme) {
                        t.theme = "light";
                    }
                } else if (missingTheme) {
                    t.theme = "light";
                }
            }

            // remember last OAuth provider (convenience only)
            if (account?.provider) t.lastProvider = account.provider;

            return t;
        },

        async session({ session, token }) {
            const t = token as AppJWT;
            if (session.user) {
                // augment the session user with our fields without using `any`
                const u: typeof session.user & {
                    id?: string;
                    role?: Role;
                    username?: string | null;
                    theme?: Theme;
                } = session.user;

                if (t.id) u.id = t.id;
                if (t.role) u.role = t.role;
                if (typeof t.username !== "undefined") u.username = t.username ?? null;
                u.theme = ensureTheme(t.theme);

                session.user = u;
            }
            return session as Session;
        },
    },

    events: {
        async createUser({ user }) {
            const email = user.email ?? null;
            const baseName = email ? email.split("@")[0] : user.name ?? `user_${user.id.slice(0, 8)}`;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "VIEWER",
                    username: baseName,
                },
            });
        },

        async signIn({ user, account }) {
            // eslint-disable-next-line no-console
            console.log(`User ${user.id} signed in with provider ${account?.provider}`);
        },

        // Drop unused `user` to satisfy no-unused-vars
        async linkAccount({ account }) {
            if (account?.provider === "steam") {
                try {
                    await getPlayerSummary(account.providerAccountId);
                    // we could enrich the db, but not sure about the logic
                    // if (s) {
                    //     await prisma.user.update({
                    //         where: { id: user.id },
                    //         data: {
                    //             // Don't stomp user-chosen values
                    //             profileImage: s.avatarfull ?? undefined,
                    //             username: user.username ?? s.personaname ?? undefined,
                    //         },
                    //     });
                    // }
                } catch {
                    /* ignore failures; Steam can be private */
                }
            }
        },
    },
}));
