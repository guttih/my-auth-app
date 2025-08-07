// src/app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/utils/auth/accessControl";
import bcrypt from "bcrypt";

export async function PATCH(req: Request, context: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasAdminAccess(session.user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { username, email, password, role, authProvider } = body;

    const updates: any = {};
    if (username) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role) updates.role = role;
    if (authProvider) updates.authProvider = authProvider;
    if (password && password.length > 0) {
        updates.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updates,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                authProvider: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (err) {
        console.error("PATCH /api/admin/users/:id error:", err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasAdminAccess(session.user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    try {
        await prisma.user.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /api/admin/users/:id error:", err);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
