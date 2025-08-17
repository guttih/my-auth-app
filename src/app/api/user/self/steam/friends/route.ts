import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSteamIdForUser, getFriendList, getFriendsWithProfiles } from "@/lib/steam";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const withProfiles = url.searchParams.get("withProfiles") === "1"; // ?withProfiles=1
    const steamid = await getSteamIdForUser(session.user.id);

    if (!steamid) return NextResponse.json({ linked: false, friends: [] });

    if (withProfiles) {
        const friends = await getFriendsWithProfiles(steamid, limit);
        // keep fields small for the client
        const payload = friends.map((f) => ({
            steamid: f.steamid,
            name: f.personaname ?? null,
            avatar: f.avatarfull ?? null,
            friend_since: f.friend_since ?? 0,
            profileurl: f.profileurl ?? null,
        }));
        return NextResponse.json({ linked: true, friends: payload });
    } else {
        const edges = await getFriendList(steamid);
        return NextResponse.json({
            linked: true,
            friends: edges.slice(0, Math.max(0, limit)).map((e) => ({
                steamid: e.steamid,
                friend_since: e.friend_since,
            })),
        });
    }
}
