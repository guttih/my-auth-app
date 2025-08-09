// src/app/api/auth/providers/credentials.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

type Creds = { username?: string; password?: string };

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
            where: { username: credentials.username },
        });

        if (!user) throw new Error("User not found");

        if (user.authProvider === "AD") {
            // call your real AD validator later
            throw new Error("AD users must sign in with Microsoft");
        } else {
            if (!user.passwordHash) throw new Error("Local user has no password");
            const valid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (!valid) throw new Error("Invalid password");
        }

        // Return minimal fields + anything you want to read in jwt callback
        return {
            id: user.id,
            name: user.username ?? undefined,
            email: user.email ?? undefined,
            // extra fields you want to pick up in jwt/session:
            username: user.username ?? null,
            role: user.role,
            theme: user.theme,
            profileImage: user.profileImage,
        } as any; // keep it 'any' or a local type; DON'T force next-auth User
    },
});
