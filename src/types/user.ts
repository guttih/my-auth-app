// src/types/user.ts

import type { Role, Theme, AuthProvider } from "@prisma/client";

export interface UserFormData {
    id?: string;
    username: string;
    email?: string;
    password?: string;
    role?: Role;
    authProvider?: AuthProvider;
    theme?: Theme;
    profileImage?: string;
    createdAt?: string;
    updatedAt?: string;
}
