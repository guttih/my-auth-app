// src/app/steam/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ConnectSteamButton from "@/components/User/ConnectSteamButton";
import CopySteamIdButton from "@/components/User/CopySteamIdButton";
import {
    getSteamIdForUser,
    getPlayerSummary,
    getRecentlyPlayed,
    getFriendsWithProfiles,
    steamGameIconURL,
    minutesToHours,
    isProfilePublic,
    type SteamFriendSummary,
} from "@/lib/steam";

export const metadata = { title: "Steam — Your profile" };

export default async function SteamPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const steamid = await getSteamIdForUser(session.user.id);
    if (!steamid) {
        return (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <h1 className="text-2xl font-bold">Steam</h1>
                <p className="text-gray-600">
                    You haven’t linked a Steam account yet. Link it to show your public Steam profile, recent games, and friends.
                </p>
                <ConnectSteamButton />
                <Link className="text-blue-600 underline block mt-4" href="/profile">
                    Back to profile
                </Link>
            </div>
        );
    }

    const [summary, recent, friends] = await Promise.all([
        getPlayerSummary(steamid),
        getRecentlyPlayed(steamid, 10),
        getFriendsWithProfiles(steamid, 24),
    ]);

    const publicProfile = isProfilePublic(summary);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-10">
            {/* Header */}
            <header className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200">
                    <Image src={summary?.avatarfull || "/favicon.ico"} alt="Avatar" fill sizes="64px" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{summary?.personaname || "Steam user"}</h1>
                    <p className="text-gray-600 text-sm">
                        SteamID: <span className="font-mono">{steamid}</span>
                        {summary?.profileurl && (
                            <>
                                {" · "}
                                <a className="text-blue-600 underline" href={summary.profileurl} target="_blank" rel="noreferrer">
                                    View on Steam
                                </a>
                            </>
                        )}
                    </p>
                    {summary?.gameid && (
                        <p className="text-sm mt-1">
                            🎮 Currently playing: <span className="font-medium">{summary.gameextrainfo || summary.gameid}</span>
                        </p>
                    )}
                </div>
            </header>

            {!publicProfile && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    <p className="font-medium">Your Steam profile is not public.</p>
                    <p className="text-sm mt-1">
                        Friends and game details may be hidden. To show them here, open <em>Profile → Privacy Settings</em> on Steam and set the
                        sections you want to <strong>Public</strong>.
                    </p>
                </div>
            )}

            {/* Recently played */}
            <section>
                <h2 className="text-xl font-semibold mb-3">Recently played</h2>
                {recent.response.games?.length ? (
                    <ul className="grid md:grid-cols-2 gap-3">
                        {recent.response.games.map((g) => (
                            <li key={g.appid} className="flex items-center gap-3 rounded-xl border p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={steamGameIconURL(g.appid, g.img_icon_url)}
                                    alt={g.name || String(g.appid)}
                                    className="object-cover w-16 h-16 rounded-lg"
                                />
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{g.name || `App ${g.appid}`}</div>
                                    <div className="text-sm text-gray-600">
                                        {minutesToHours(g.playtime_2weeks)} h last 2 weeks · {minutesToHours(g.playtime_forever)} h total
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No recent games (or your game details are private).</p>
                )}
            </section>

            {/* Friends */}
            <section>
                <h2 className="text-xl font-semibold mb-3">Friends</h2>
                {friends.length ? (
                    <ul className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {friends.map((f: SteamFriendSummary) => (
                            <li key={f.steamid} className="rounded-xl border p-3 flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-gray-200">
                                    <Image src={f.avatarfull || "/favicon.ico"} alt={f.personaname || f.steamid} fill sizes="48px" />
                                </div>

                                {/* make this flex-1 so the copy button hugs the right edge */}
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{f.personaname || f.steamid}</div>
                                    <div className="text-xs text-gray-600">since {new Date((f.friend_since || 0) * 1000).toLocaleDateString()}</div>
                                    {f.profileurl && (
                                        <a href={f.profileurl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                            View profile
                                        </a>
                                    )}
                                </div>

                                {/* ✅ client-side copy button */}
                                <CopySteamIdButton steamid={f.steamid} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">We can’t show friends (either you have none on Steam 😅, or your friends list is private).</p>
                )}
            </section>

            <div className="flex gap-4">
                <Link className="text-blue-600 underline" href="/profile">
                    Back to profile
                </Link>
                <a className="text-blue-600 underline" href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noreferrer">
                    Open Steam privacy settings
                </a>
            </div>
        </div>
    );
}
