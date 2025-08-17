// src/lib/steam.ts
export async function fetchSteamPersona(steamid: string) {
    if (!process.env.STEAM_API_KEY) return null;
    const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
    url.searchParams.set("key", process.env.STEAM_API_KEY);
    url.searchParams.set("steamids", steamid);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.response?.players?.[0] ?? null;
}
