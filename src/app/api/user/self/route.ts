// src/app/api/user/self/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
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

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, email, password } = body;

    if (!username || typeof username !== "string") {
        return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const updates: any = {
        username,
    };

    if (email !== undefined) {
        updates.email = email;
    }

    if (password && password.length > 0) {
        updates.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
        const updated = await prisma.user.update({
            where: { email: session.user.email },
            data: updates,
            select: {
                id: true,
                username: true,
                email: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("PATCH /api/user/self error:", err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
