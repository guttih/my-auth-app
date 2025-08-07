// credentials.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma"; // we'll extract Prisma next
import type { User } from "next-auth";

async function validateWithAD(username: string, password: string): Promise<boolean> {
    // Real implementation later
    return false;
}

export const credentialsProvider = CredentialsProvider({
    name: "Credentials",
    credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.user.findUnique({
            where: { username: credentials.username },
        });

        if (!user) throw new Error("User not found");

        if (user.authProvider === "AD") {
            const valid = await validateWithAD(user.username, credentials.password);
            if (!valid) throw new Error("Invalid AD credentials");
        } else {
            if (!user.passwordHash) throw new Error("Local user has no password");
            const valid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (!valid) throw new Error("Invalid password");
        }

        return {
            id: user.id,
            name: user.username, // Still needed for NextAuth internal compatibility
            email: user.email ?? undefined,
            username: user.username,
            role: user.role,
        } as User;
    },
});
