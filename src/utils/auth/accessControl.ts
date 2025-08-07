// src/utils/auth/accessControl.ts

import { Role } from "@prisma/client";

// Generic role check: true if user has the required role or higher
export function hasRole(user: { role?: string }, required: Role): boolean {
    const roleHierarchy = [Role.VIEWER, Role.MODERATOR, Role.ADMIN];

    const userIndex = roleHierarchy.indexOf(user?.role as Role);
    const requiredIndex = roleHierarchy.indexOf(required);

    return userIndex >= requiredIndex;
}

// User session object as received from getServerSession
export function hasAdminAccess(user: { role?: string }): boolean {
    return hasRole(user, Role.ADMIN);
}

export function hasModeratorAccess(user: { role?: string }): boolean {
    return hasRole(user, Role.MODERATOR);
}

export function hasViewerAccess(user: { role?: string }): boolean {
    return hasRole(user, Role.VIEWER);
}

export { Role } from "@prisma/client";
