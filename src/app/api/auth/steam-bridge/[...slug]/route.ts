// src/app/api/auth/steam-bridge/[...slug]/route.ts
import type { NextRequest } from "next/server";

// Next 15: params is async. Await it.
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug?: string[] }> }) {
    const { slug } = await ctx.params;
    const provider = slug?.[slug.length - 1] ?? "steam"; // use last segment, default steam

    const url = new URL(req.url);
    const search = url.searchParams;
    // Make Auth.js v5 happy:
    search.set("code", "123");

    const dest = new URL(`/api/auth/callback/${provider}`, process.env.NEXTAUTH_URL);
    dest.search = search.toString();
    return Response.redirect(dest.toString());
}

export async function POST() {
    // “fake token” endpoint expected by the provider
    return Response.json({ token: "123" });
}
