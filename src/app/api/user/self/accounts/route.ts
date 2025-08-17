// src/app/api/user/self/accounts/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function decodeJwtPayload(token?: string | null) {
    if (!token) return {};
    try {
        const [, payload] = token.split(".");
        const json = Buffer.from(payload, "base64url").toString("utf8");
        return JSON.parse(json);
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
            id_token: true, // Prisma/NextAuth column (nullable)
        },
        orderBy: { provider: "asc" },
    });

    const accounts = rows.map((a) => {
        const claims: any = decodeJwtPayload(a.id_token);
        // Prefer email-like identifiers
        const label = claims?.email || claims?.preferred_username || claims?.upn || claims?.unique_name || claims?.name || a.providerAccountId; // fallback
        const picture = claims?.picture as string | undefined;

        return {
            id: a.id,
            provider: a.provider, // "google" | "azure-ad"
            providerAccountId: a.providerAccountId,
            label, // what we show (email/username)
            picture, // optional avatar (Google usually has it)
        };
    });

    return NextResponse.json({ accounts });
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accountId } = await req.json().catch(() => ({}));
    if (!accountId) return NextResponse.json({ error: "Missing accountId" }, { status: 400 });

    // Avoid lockout: block unlink if this is the last method and user has no password
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
