// src/app/api/auth/providers/credentials.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AuthProvider } from "@prisma/client";

type Creds = { username?: string; password?: string };

// NOTE (new semantics):
// false (default)  => always allow password
// true             => DISABLE password if user has linked OAuth (AD/GOOGLE)
const DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT = (process.env.DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT ?? "").trim().toLowerCase() === "false";

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

        // Treat any non-LOCAL as OAuth-backed. If your enum includes GOOGLE, this will match explicitly;
        // if not, keep using AD or extend the enum when you add Google.
        const isOAuthBacked = user.authProvider !== (AuthProvider as any).LOCAL;

        // With your requested semantics:
        // - when DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT === true, block passwords if the user is OAuth-backed
        // - when false, always allow password (even if linked)
        if (DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT && isOAuthBacked) {
            const code = user.authProvider === (AuthProvider as any).AD ? "OAUTH_ONLY_MICROSOFT" : "OAUTH_ONLY_GOOGLE";
            // Important: return null gives generic CredentialsSignin; throwing preserves .error for signIn({ redirect:false })
            throw new Error(code);
        }

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
