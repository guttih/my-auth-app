// src/lib/auth/decide.ts
import { prisma } from "@/lib/prisma";
import { globalProviders, getLinkedProviders, getUserPolicy, type OAuthPolicy } from "./policy";
import { ProviderId, type OAuthProviderId } from "@/lib/auth/provider-ids";

/** Compute which providers should be visible/usable for a given user. */
export async function visibleProvidersForUser(userId: string) {
    const g = globalProviders();
    const policy = await getUserPolicy(userId);
    const linked = await getLinkedProviders(userId); // Record<OAuthProviderId, boolean>

    // Credentials enabled globally and user policy allows password
    let credentials = g[ProviderId.Credentials] && policy.passwordEnabled;

    // Optionally disable password if any OAuth is linked
    if (g.disablePasswordWhenLinked && (linked[ProviderId.AzureAd] || linked[ProviderId.Google] || linked[ProviderId.Steam])) {
        credentials = false;
    }

    // Start with global availability for each OAuth provider
    let microsoft = g[ProviderId.AzureAd];
    let google = g[ProviderId.Google];
    let steam = g[ProviderId.Steam];

    // Apply per-user OAuth policy
    microsoft = enforcePolicy(policy.oauthPolicy, ProviderId.AzureAd, microsoft);
    google = enforcePolicy(policy.oauthPolicy, ProviderId.Google, google);
    steam = enforcePolicy(policy.oauthPolicy, ProviderId.Steam, steam);

    return {
        credentials,
        microsoft, // azure-ad
        google,
        steam,
        linked, // { 'azure-ad': boolean, google: boolean, steam: boolean }
    };
}

/** Helper: apply OAuthPolicy to a single provider flag */
function enforcePolicy(policy: OAuthPolicy, provider: OAuthProviderId, current: boolean): boolean {
    if (!current) return false;
    switch (policy.kind) {
        case "NONE":
            return false;
        case "ANY":
            return true;
        case "ALLOW_ONLY":
            return policy.allow.includes(provider);
        default:
            return current;
    }
}

/**
 * Preflight for a username before attempting credentials signin.
 * If credentials are not allowed but one or more OAuth providers are,
 * return a code guiding the UI. Includes STEAM.
 */
export async function preflightForUsername(username: string) {
    const uname = username.trim();
    if (!uname) return { code: null as const };

    const user = await prisma.user.findUnique({
        where: { username: uname },
        select: { id: true },
    });
    if (!user) return { code: null as const };

    const vis = await visibleProvidersForUser(user.id);

    // If credentials are blocked but any OAuth is available, steer the UI
    if (!vis.credentials && (vis.microsoft || vis.google || vis.steam)) {
        // Use the UI-facing provider strings your login page expects
        const providers = [] as Array<"microsoft" | "google" | "steam">;
        if (vis.microsoft) providers.push("microsoft");
        if (vis.google) providers.push("google");
        if (vis.steam) providers.push("steam");

        if (providers.length === 1) {
            const only = providers[0];
            if (only === "microsoft") return { code: "OAUTH_ONLY_MICROSOFT" as const, providers };
            if (only === "google") return { code: "OAUTH_ONLY_GOOGLE" as const, providers };
            return { code: "OAUTH_ONLY_STEAM" as const, providers };
        }

        // Multiple OAuth routes allowed
        return { code: "OAUTH_ONLY" as const, providers };
    }

    return { code: null as const };
}
