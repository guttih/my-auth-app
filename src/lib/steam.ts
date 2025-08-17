// src/lib/steam.ts
// Server-only helpers for Steam. NEVER import this in a client component.

import { prisma } from "@/lib/prisma";

const BASE = "https://api.steampowered.com";
const KEY = process.env.STEAM_API_KEY!; // required

// Reusable fetch wrapper with light caching.
// If you're worried about rate limits, bump revalidate (e.g. 120–300s).
async function steamApi<T>(endpoint: string, params: Record<string, string | number>, revalidate = 60) {
    if (!KEY) throw new Error("STEAM_API_KEY is not set");
    const u = new URL(`${BASE}/${endpoint}`);
    u.searchParams.set("key", KEY);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));

    const res = await fetch(u.toString(), { next: { revalidate } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Steam API ${endpoint} ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
}

export async function getSteamIdForUser(userId: string) {
    const acct = await prisma.account.findFirst({
        where: { userId, provider: "steam" },
        select: { providerAccountId: true },
    });
    return acct?.providerAccountId ?? null; // 17-digit steamid64
}

// ----- Player summary -----

export type SteamPlayerSummary = {
    steamid: string;
    personaname?: string;
    avatarfull?: string;
    profileurl?: string;
    communityvisibilitystate?: number; // 1 private, 3 public
    personastate?: number; // 0 offline..5 online-ish
    gameid?: string;
    gameextrainfo?: string;
    timecreated?: number;
    loccountrycode?: string;
};

export async function getPlayerSummary(steamid: string) {
    type R = { response: { players: SteamPlayerSummary[] } };
    const data = await steamApi<R>("ISteamUser/GetPlayerSummaries/v0002/", { steamids: steamid }, 60);
    return data.response.players[0] ?? null;
}

// ----- Recently played -----

export type RecentlyPlayed = {
    appid: number;
    name?: string;
    playtime_2weeks?: number; // minutes
    playtime_forever?: number; // minutes
    img_icon_url?: string;
};

export async function getRecentlyPlayed(steamid: string, count = 10) {
    type R = { response: { total_count: number; games?: RecentlyPlayed[] } };
    return steamApi<R>("IPlayerService/GetRecentlyPlayedGames/v0001/", { steamid, count }, 60);
}

// ----- Owned games (kept for later UI use) -----

export async function getOwnedGames(steamid: string) {
    type R = { response: { game_count: number; games?: Array<{ appid: number; name?: string; playtime_forever?: number; img_icon_url?: string }> } };
    return steamApi<R>(
        "IPlayerService/GetOwnedGames/v0001/",
        {
            steamid,
            include_appinfo: 1,
            include_played_free_games: 1,
        },
        300
    );
}

// ----- Friends -----

export type SteamFriendEdge = { steamid: string; relationship: string; friend_since: number };
export type SteamFriendSummary = SteamPlayerSummary & { friend_since: number };

export async function getFriendList(steamid: string) {
    type R = { friendslist?: { friends: SteamFriendEdge[] } };
    // Note: returns undefined if the user's friends are private
    const data = await steamApi<R>("ISteamUser/GetFriendList/v0001/", { steamid, relationship: "friend" }, 120);
    return data.friendslist?.friends ?? [];
}

// Valve’s GetPlayerSummaries accepts up to ~100 IDs per call — chunk to be safe.
function chunk<T>(arr: T[], size: number) {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export async function getFriendsSummaries(steamids: string[]) {
    type R = { response: { players: SteamPlayerSummary[] } };
    const CHUNK = 100;
    const chunks = chunk(steamids, CHUNK);
    const results = await Promise.all(chunks.map((c) => steamApi<R>("ISteamUser/GetPlayerSummaries/v0002/", { steamids: c.join(",") }, 120)));
    const players = results.flatMap((r) => r.response.players);
    const byId = new Map(players.map((p) => [p.steamid, p]));
    return byId;
}

/**
 * Get friends with hydrated persona/avatars, sorted by most recent friend_since.
 * If `limit` is provided, returns that many from the top.
 */
export async function getFriendsWithProfiles(steamid: string, limit?: number): Promise<SteamFriendSummary[]> {
    const edges = await getFriendList(steamid);
    if (!edges.length) return [];

    const ids = edges.map((e) => e.steamid);
    const map = await getFriendsSummaries(ids);

    const merged = edges.map<SteamFriendSummary>((e) => ({
        friend_since: e.friend_since,
        ...(map.get(e.steamid) ?? { steamid: e.steamid }),
    }));

    // newest friends first
    merged.sort((a, b) => b.friend_since - a.friend_since);
    return typeof limit === "number" ? merged.slice(0, Math.max(0, limit)) : merged;
}

// ----- Small UI helpers -----

export function steamGameIconURL(appid: number, hash?: string) {
    return hash
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`
        : `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_184x69.jpg`;
}

export function minutesToHours(min?: number) {
    if (!min) return 0;
    return Math.round((min / 60) * 10) / 10;
}

export function isProfilePublic(summary: SteamPlayerSummary | null) {
    return (summary?.communityvisibilitystate ?? 0) === 3;
}
