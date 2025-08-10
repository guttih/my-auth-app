// src/app/api/user/self/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import type { Prisma, Theme } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            authProvider: true,
            createdAt: true,
            updatedAt: true,
            theme: true,
            profileImage: true,
        },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, email, password, theme, profileImage } = await req.json();

    const updates: Partial<Prisma.UserUpdateInput> = {};
    if (typeof username === "string") updates.username = username;
    if (typeof email === "string" || email === null) updates.email = email;
    if (typeof theme === "string") updates.theme = theme as Theme; // Prisma enum validated server-side
    if (typeof profileImage === "string" || profileImage === null) updates.profileImage = profileImage;
    if (password && password.length > 0) updates.passwordHash = await bcrypt.hash(password, 10);

    try {
        const updated = await prisma.user.update({
            where: { id: session.user.id }, // <- don’t trust body.id
            data: updates,
            select: { email: true, role: true, theme: true, profileImage: true, updatedAt: true },
        });
        return NextResponse.json(updated);
    } catch (err) {
        console.error("PATCH /api/user/self error:", err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
