// src/app/api/user/self/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Prisma, type Theme } from "@prisma/client"; // <-- value import for error narrowing

// Ensure this route is always dynamic and not statically cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generic helper; no `any`
function json<T>(data: T, init?: number | ResponseInit) {
    const res = NextResponse.json<T>(data, init);
    // Personal data: prevent any caching layers
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
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
    if (!user) return json({ error: "User not found" }, { status: 404 });

    const res = json(user);
    res.cookies.set("theme", user.theme, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });
    return res;
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

    const { username, email, password, theme, profileImage } = await req.json();

    const updates: Partial<Prisma.UserUpdateInput> = {};
    if (typeof username === "string") updates.username = username.trim();
    if (typeof email === "string" || email === null) updates.email = email;
    if (typeof theme === "string") updates.theme = theme as Theme; // enum validated by Prisma
    if (typeof profileImage === "string" || profileImage === null) updates.profileImage = profileImage;
    if (password && password.length > 0) updates.passwordHash = await bcrypt.hash(password, 10);

    try {
        const updated = await prisma.user.update({
            where: { id: session.user.id }, // never trust body.id
            data: updates,
            select: { email: true, role: true, theme: true, profileImage: true, updatedAt: true },
        });

        const res = json(updated);
        res.cookies.set("theme", updated.theme, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
        return res;
    } catch (err: unknown) {
        // <-- no `any`
        // Prisma unique constraint (P2002)
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const target = Array.isArray((err.meta as { target?: unknown } | undefined)?.target)
                ? ((err.meta as { target?: unknown })?.target as string[]).join(", ")
                : "unique field";
            return json({ error: `Duplicate value for: ${target}` }, { status: 409 });
        }
        console.error("PATCH /api/user/self error:", err);
        return json({ error: "Update failed" }, { status: 500 });
    }
}
