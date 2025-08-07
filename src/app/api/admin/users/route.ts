// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/utils/auth/accessControl";

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
        },
    });

    return NextResponse.json(users);
}
