// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/utils/auth/accessControl";
import bcrypt from "bcrypt";
import type { UserFormData } from "@/types/user";

// Get all users
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !hasAdminAccess(session.user)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
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

    return NextResponse.json(users);
}

// Create a new user
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !hasAdminAccess(session.user)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: UserFormData = await req.json();
    const { username, email, password, role, authProvider, theme, profileImage } = body;
    if (!username || !password) {
        return new NextResponse("Missing username or password", { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        return new NextResponse("Username already exists", { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            role: role || "VIEWER",
            authProvider: authProvider || "LOCAL",
            theme: theme || "light",
            profileImage: profileImage || "",
        },
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

    return NextResponse.json(newUser, { status: 201 });
}
