// src/lib/auth/policy.ts
// Source of truth for global flags, enabled providers, and linked providers (type-safe).

import { prisma } from "@/lib/prisma";
import { ProviderId, type OAuthProviderId } from "@/lib/auth/provider-ids";

export function envBool(v: string | undefined, def = false) {
    const s = (v ?? "").trim().toLowerCase();
    if (!s) return def;
    return !["false", "0", "no", "off"].includes(s);
}

/**
 * Which providers are globally enabled by env.
 * Returns a typed shape so you don’t spread strings around.
 */
export function globalProviders() {
    const credentials = envBool(process.env.AUTH_CREDENTIALS_ENABLED, true);
    const microsoft = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);
    const google = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const steam = !!process.env.STEAM_SECRET; // Steam is OpenID; your lib uses this app-local secret

    const disablePasswordWhenLinked = envBool(process.env.DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT, false);

    return {
        [ProviderId.Credentials]: credentials,
        [ProviderId.AzureAd]: microsoft,
        [ProviderId.Google]: google,
        [ProviderId.Steam]: steam,
        disablePasswordWhenLinked,
    } as const;
}

export type LinkedProviders = Record<OAuthProviderId, boolean>;

/**
 * Linked OAuth providers for a given user (type-safe, no bare strings).
 */
export async function getLinkedProviders(userId: string): Promise<LinkedProviders> {
    const inList: OAuthProviderId[] = [ProviderId.AzureAd, ProviderId.Google, ProviderId.Steam];

    const accounts = await prisma.account.findMany({
        where: { userId, provider: { in: inList } },
        select: { provider: true },
    });

    const set = new Set(accounts.map((a) => a.provider as OAuthProviderId));

    return {
        [ProviderId.AzureAd]: set.has(ProviderId.AzureAd),
        [ProviderId.Google]: set.has(ProviderId.Google),
        [ProviderId.Steam]: set.has(ProviderId.Steam),
    };
}

/**
 * Optional per-user policy
 * Prefer a structured type over many string literals.
 */
export type OAuthPolicy =
    | { kind: "ANY" } // any OAuth provider allowed
    | { kind: "NONE" } // no OAuth allowed
    | { kind: "ALLOW_ONLY"; allow: readonly OAuthProviderId[] }; // whitelist

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserPolicy(userId: string): Promise<{ passwordEnabled: boolean; oauthPolicy: OAuthPolicy }> {
    // If you don’t have columns yet, return permissive defaults.
    // Later, add to Prisma:
    //   passwordEnabled Boolean @default(true)
    //   oauthPolicy     Json    @default("{\"kind\":\"ANY\"}")
    return { passwordEnabled: true, oauthPolicy: { kind: "ANY" } };
}
