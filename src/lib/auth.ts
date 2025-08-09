// src/lib/auth.ts
import { credentialsProvider } from "@/app/api/auth/providers/credentials";
import azureAdProvider from "@/app/api/auth/providers/azure-ad";
import googleProvider from "@/app/api/auth/providers/google";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, User } from "next-auth";
import type { AuthProvider as AuthProviderEnum, Role } from "@prisma/client";

// Narrow the providers we map
const providerMap = {
    "azure-ad": "AD",
    google: "GOOGLE",
} as const;
type ProviderKey = keyof typeof providerMap;

function mapOAuthToAuthProvider(p?: string): AuthProviderEnum | undefined {
    return (p && (providerMap as Record<string, AuthProviderEnum>)[p]) || undefined;
}

// Type guard for user with id
function hasId(u: unknown): u is { id: string } {
    return typeof u === "object" && u !== null && "id" in u && typeof (u as { id: unknown }).id === "string";
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [credentialsProvider, azureAdProvider(), googleProvider()],
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },

    callbacks: {
        async jwt({ token, user, account }) {
            // seed token.id once
            if (user && hasId(user)) token.id = user.id;

            // if we came via OAuth this time, set a tentative authProvider
            if (account?.provider) {
                const mapped = mapOAuthToAuthProvider(account.provider);
                if (mapped) token.authProvider = mapped;
            }

            // ensure role/username/authProvider from DB (source of truth)
            const needDb = !token.role || typeof token.username === "undefined" || !token.authProvider;

            if (needDb) {
                const where = token.id ? { id: token.id as string } : token.email ? { email: token.email as string } : null;

                if (where) {
                    const db = await prisma.user.findUnique({
                        where,
                        select: { role: true, username: true, authProvider: true },
                    });
                    if (db) {
                        token.role = db.role;
                        token.username = db.username ?? null;
                        token.authProvider = db.authProvider ?? token.authProvider;
                    }
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                if (token.id) session.user.id = token.id;
                if (token.role) session.user.role = token.role as Role;
                if (typeof token.username !== "undefined") {
                    session.user.username = (token.username as string | null) ?? null;
                }
                if (token.authProvider) {
                    session.user.authProvider = token.authProvider as AuthProviderEnum;
                }
            }
            return session;
        },
    },

    events: {
        // brand-new DB user created by OAuth or credentials
        async createUser({ user }) {
            // Which provider created this user? (expect 1 account at this moment)
            const accounts = await prisma.account.findMany({
                where: { userId: user.id },
                select: { provider: true },
                take: 1,
            });
            const provider = accounts[0]?.provider as ProviderKey | undefined;
            const mapped = mapOAuthToAuthProvider(provider);

            // Build a stable username
            const email = (user as Pick<User, "email">).email ?? null;
            const baseName = email ? email.split("@")[0] : user.name ?? `user_${user.id.slice(0, 8)}`;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "VIEWER",
                    authProvider: mapped ?? "LOCAL",
                    username: baseName,
                },
            });
        },

        // when a signed-in user links a new provider
        async linkAccount({ user, account }) {
            const mapped = mapOAuthToAuthProvider(account?.provider);
            if (!mapped) return;

            // policy: if currently LOCAL (or null), reflect the newly linked provider
            const current = await prisma.user.findUnique({
                where: { id: user.id },
                select: { authProvider: true },
            });

            if (!current?.authProvider || current.authProvider === "LOCAL") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { authProvider: mapped },
                });
            }
        },
    },
};
