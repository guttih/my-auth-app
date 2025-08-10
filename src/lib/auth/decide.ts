// src/lib/auth/decide.ts
import { prisma } from "@/lib/prisma";
import { globalProviders, getLinkedProviders, getUserPolicy } from "./policy";

export async function visibleProvidersForUser(userId: string) {
    const g = globalProviders();
    const p = await getUserPolicy(userId);
    const linked = await getLinkedProviders(userId);

    let credentials = g.credentials && p.passwordEnabled;
    if (g.disablePasswordWhenLinked && (linked.microsoft || linked.google)) credentials = false;

    let microsoft = g.microsoft && p.oauthPolicy !== "NONE";
    let google = g.google && p.oauthPolicy !== "NONE";
    if (p.oauthPolicy === "MICROSOFT_ONLY") google = false;
    if (p.oauthPolicy === "GOOGLE_ONLY") microsoft = false;

    return { credentials, microsoft, google, linked };
}

export async function preflightForUsername(username: string) {
    const uname = username.trim();
    if (!uname) return { code: null as const };

    const user = await prisma.user.findUnique({ where: { username: uname }, select: { id: true } });
    if (!user) return { code: null as const };

    const vis = await visibleProvidersForUser(user.id);

    if (!vis.credentials && (vis.microsoft || vis.google)) {
        const providers: Array<"microsoft" | "google"> = [];
        if (vis.microsoft) providers.push("microsoft");
        if (vis.google) providers.push("google");

        if (providers.length === 1) {
            return {
                code: providers[0] === "microsoft" ? ("OAUTH_ONLY_MICROSOFT" as const) : ("OAUTH_ONLY_GOOGLE" as const),
                providers,
            };
        }
        // Both allowed
        return { code: "OAUTH_ONLY" as const, providers };
    }

    return { code: null as const };
}
