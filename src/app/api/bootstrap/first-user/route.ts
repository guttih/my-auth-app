// src/app/api/bootstrap/first-user/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
    // Only allow while there are no users
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0) {
        return new NextResponse("Bootstrap disabled: users already exist.", { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const { username, email, password } = body as { username?: string; email?: string; password?: string };

    if (!username || !password) {
        return new NextResponse("Missing username or password", { status: 400 });
    }

    const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: email || "" }] },
    });
    if (existing) {
        return new NextResponse("Username or email already exists", { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            username,
            email: email || null,
            passwordHash,
            role: "ADMIN", // <-- force ADMIN on first user
            theme: "light",
            profileImage: "",
        },
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

    return NextResponse.json(newUser, { status: 201 });
}
