// src/app/api/user/self/steam/summary/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSteamIdForUser, getPlayerSummary, getRecentlyPlayed } from "@/lib/steam";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const steamid = await getSteamIdForUser(session.user.id);
    if (!steamid) return NextResponse.json({ linked: false });

    try {
        const profile = await getPlayerSummary(steamid); // persona, avatar, url, etc.
        const recent = await getRecentlyPlayed(steamid); // last 2 weeks
        return NextResponse.json({ linked: true, steamid, profile, recent });
    } catch (e) {
        return NextResponse.json({ linked: true, steamid, error: (e as Error).message }, { status: 502 });
    }
}
