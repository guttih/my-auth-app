// src/app/api/auth/[...nextauth]/route.ts
// Build providers per request (so Steam gets req).
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptionsBase } from "@/lib/auth";
import { getProviders } from "@/app/api/auth/providers";

// Keep your shared options in authOptions (without providers).
// Then override providers here using getProviders(req).

export async function GET(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
    return NextAuth(req, ctx, {
        ...authOptionsBase,
        providers: getProviders(req),
    });
}

export async function POST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
    return NextAuth(req, ctx, {
        ...authOptionsBase,
        providers: getProviders(req),
    });
}
