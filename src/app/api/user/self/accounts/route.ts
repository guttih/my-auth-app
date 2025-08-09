// src/app/api/user/self/accounts/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
        where: { userId: session.user.id },
        select: { id: true, provider: true, providerAccountId: true },
    });
    return NextResponse.json({ accounts });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
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
