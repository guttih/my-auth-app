// src/app/api/admin/users/[id]/accounts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/utils/auth/accessControl";

function decodeJwtPayload(token?: string | null) {
    if (!token) return {};
    try {
        const [, payload] = token.split(".");
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        return {};
    }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasAdminAccess(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = await prisma.account.findMany({
        where: { userId: params.id },
        select: { id: true, provider: true, providerAccountId: true, id_token: true },
        orderBy: { provider: "asc" },
    });

    const accounts = rows.map((a) => {
        const c: any = decodeJwtPayload(a.id_token);
        const label = c?.email ?? c?.preferred_username ?? c?.upn ?? c?.unique_name ?? c?.name ?? a.providerAccountId;
        const picture = c?.picture as string | undefined;
        return { id: a.id, provider: a.provider, providerAccountId: a.providerAccountId, label, picture };
    });

    return NextResponse.json({ accounts });
}
