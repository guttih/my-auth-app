// src/app/api/auth/providers/credentials.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AuthProvider } from "@prisma/client";

type Creds = { username?: string; password?: string };

// optional: allow password for users who also have OAuth during migration
const ALLOW_PASSWORD_WHEN_OAUTH = (process.env.ALLOW_PASSWORD_WHEN_OAUTH ?? "").toLowerCase() === "true";

export const credentialsProvider = CredentialsProvider({
    name: "Credentials",
    credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
        const { username, password } = (credentials ?? {}) as Creds;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                theme: true,
                profileImage: true,
                authProvider: true,
                passwordHash: true,
            },
        });

        if (!user) throw new Error("USER_NOT_FOUND");

        // Enforce provider-only login for OAuth users by default
        if ((user.authProvider === AuthProvider.AD || user.authProvider === AuthProvider.GOOGLE) && !ALLOW_PASSWORD_WHEN_OAUTH) {
            // Use distinct codes so /login can show the right CTA
            const code = user.authProvider === AuthProvider.AD ? "OAUTH_ONLY_MICROSOFT" : "OAUTH_ONLY_GOOGLE";
            throw new Error(code);
        }

        // Local (or migration mode): verify password
        if (!user.passwordHash) throw new Error("NO_LOCAL_PASSWORD");

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new Error("INVALID_PASSWORD");

        return {
            id: user.id,
            name: user.username ?? undefined,
            email: user.email ?? undefined,
            username: user.username ?? null,
            role: user.role,
            theme: user.theme,
            profileImage: user.profileImage,
        };
    },
});
