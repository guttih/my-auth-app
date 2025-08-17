// src/app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/utils/auth/accessControl";
import bcrypt from "bcrypt";
import { UserFormData } from "@/types/user";
import type { Prisma } from "@prisma/client";

// Get spesific user
export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !hasAdminAccess(session.user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                theme: true,
                profileImage: true,
            },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (err) {
        console.error("GET /api/admin/users/:id error:", err);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

// Update an existing user
export async function PATCH(req: Request, context: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user || !hasAdminAccess(session.user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body: UserFormData = await req.json();
    const { username, email, password, role, theme, profileImage } = body;

    const updates: Prisma.UserUpdateInput = {};
    if (username) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role) updates.role = role;
    if (password && password.length > 0) {
        updates.passwordHash = await bcrypt.hash(password, 10);
    }
    if (theme) updates.theme = theme;
    if (profileImage) updates.profileImage = profileImage;

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updates,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                theme: true,
                profileImage: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (err) {
        console.error("PATCH /api/admin/users/:id error:", err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// Delete an existing user user
export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !hasAdminAccess(session.user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        await prisma.user.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /api/admin/users/:id error:", err);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
