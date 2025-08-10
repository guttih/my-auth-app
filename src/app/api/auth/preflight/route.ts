// src/app/api/auth/preflight/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthProvider } from "@prisma/client";

const DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT = (process.env.DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT ?? "").trim().toLowerCase() === "true";

export async function POST(req: Request) {
    try {
        const { username } = (await req.json()) as { username?: string };
        if (!username) return NextResponse.json({ code: null });

        const user = await prisma.user.findUnique({
            where: { username },
            select: { authProvider: true },
        });

        if (!user) return NextResponse.json({ code: null });

        // Treat anything that isn't LOCAL as "OAuth-backed"
        const isOAuthBacked = user.authProvider !== (AuthProvider as any).LOCAL;

        if (DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT && isOAuthBacked) {
            const code = user.authProvider === (AuthProvider as any).AD ? "OAUTH_ONLY_MICROSOFT" : "OAUTH_ONLY_GOOGLE"; // future-proof if you add GOOGLE to the enum
            return NextResponse.json({ code });
        }

        return NextResponse.json({ code: null });
    } catch {
        // On errors, fail open (don’t block credentials form)
        return NextResponse.json({ code: null });
    }
}
