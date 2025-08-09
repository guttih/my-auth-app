// src/types/next-auth.d.ts
import { Role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username?: string | null;
            role?: Role;
            theme?: string;
            profileImage?: string | null;
        } & DefaultSession["user"];
    }

    // Either omit this entirely or keep optional fields
    interface User extends DefaultUser {
        id: string;
        username?: string | null;
        role?: Role;
        theme?: string;
        profileImage?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        username?: string | null;
        role?: Role;
        theme?: string;
        profileImage?: string | null;
    }
}
