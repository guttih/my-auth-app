// src/app/api/admin/stats/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/utils/auth/accessControl";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !hasAdminAccess(session.user)) {
        return new Response("Forbidden", { status: 403 });
    }

    const [userCount, adminCount] = await Promise.all([prisma.user.count(), prisma.user.count({ where: { role: "ADMIN" } })]);

    return Response.json({ userCount, adminCount });
}
