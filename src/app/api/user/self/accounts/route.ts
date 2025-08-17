// src/app/api/user/self/accounts/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type IdTokenClaims = {
    email?: string;
    preferred_username?: string;
    upn?: string;
    unique_name?: string;
    name?: string;
    picture?: string;
    [key: string]: unknown;
};

function decodeJwtPayload(token?: string | null): IdTokenClaims {
    if (!token) return {};
    try {
        const [, payload] = token.split(".");
        const json = Buffer.from(payload, "base64url").toString("utf8");
        return JSON.parse(json) as IdTokenClaims;
    } catch {
        return {};
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ accounts: [] });
    }

    const rows = await prisma.account.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            provider: true,
            providerAccountId: true,
            id_token: true,
        },
        orderBy: { provider: "asc" },
    });

    const accounts = rows.map((a) => {
        const claims = decodeJwtPayload(a.id_token);
        const label = claims.email || claims.preferred_username || claims.upn || claims.unique_name || claims.name || a.providerAccountId;

        const picture = typeof claims.picture === "string" ? claims.picture : undefined;

        return {
            id: a.id,
            provider: a.provider,
            providerAccountId: a.providerAccountId,
            label,
            picture,
        };
    });

    return NextResponse.json({ accounts });
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accountId } = await req.json().catch(() => ({} as { accountId?: string }));
    if (!accountId) return NextResponse.json({ error: "Missing accountId" }, { status: 400 });

    const [user, accounts] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } }),
        prisma.account.findMany({ where: { userId: session.user.id } }),
    ]);

    const hasPassword = Boolean(user?.passwordHash);
    if (!hasPassword && accounts.length <= 1) {
        return NextResponse.json({ error: "Cannot unlink the last sign-in method. Add another first." }, { status: 400 });
    }

    await prisma.account.delete({ where: { id: accountId } });
    return NextResponse.json({ ok: true });
}
