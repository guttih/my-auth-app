// src/types/next-auth.d.ts
import type { Role, Theme, AuthProvider } from "@prisma/client";
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username?: string | null;
            role?: Role;
            authProvider?: AuthProvider; // Prisma enum type
            theme?: Theme;
            profileImage?: string | null;
        } & Omit<DefaultSession["user"], "id">;
    }

    interface User extends DefaultUser {
        id: string;
        username?: string | null;
        role?: Role;
        authProvider?: AuthProvider; // Prisma enum type
        theme?: Theme;
        profileImage?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        username?: string | null;
        role?: Role;
        authProvider?: AuthProvider; // Prisma enum type
        theme?: Theme;
        profileImage?: string | null;
    }
}
