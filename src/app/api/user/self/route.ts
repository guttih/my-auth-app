// src/app/api/user/self/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { username: session.user.name },
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

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { id, username, email, password, theme, profileImage } = body;

    if (!id || typeof id !== "string") {
        return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    if (!username || typeof username !== "string") {
        return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const updates: Partial<Prisma.UserUpdateInput> = {
        username,
    };

    if (email !== undefined) {
        updates.email = email;
    }

    if (password && password.length > 0) {
        updates.passwordHash = await bcrypt.hash(password, 10);
    }

    if (theme) {
        updates.theme = theme;
    }

    if (profileImage) {
        updates.profileImage = profileImage;
    }
    try {
        const updated = await prisma.user.update({
            where: { id },
            data: updates,
            select: {
                email: true,
                role: true,
                theme: true,
                profileImage: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("PATCH /api/user/self error:", err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
