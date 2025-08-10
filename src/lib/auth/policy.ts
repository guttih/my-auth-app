// src/lib/auth/policy.ts
// Source of truth for global flags, linked providers, and (optional) per-user policy.

import { prisma } from "@/lib/prisma";

export function envBool(v: string | undefined, def = false) {
    const s = (v ?? "").trim().toLowerCase();
    if (!s) return def;
    return !["false", "0", "no", "off"].includes(s);
}

export function globalProviders() {
    return {
        credentials: envBool(process.env.AUTH_CREDENTIALS_ENABLED, true),
        microsoft: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET),
        google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        disablePasswordWhenLinked: envBool(process.env.DISABLE_PASSWORD_WHEN_LINKED_ACCOUNT, false),
    };
}

export async function getLinkedProviders(userId: string) {
    const accounts = await prisma.account.findMany({
        where: { userId, provider: { in: ["azure-ad", "google"] } },
        select: { provider: true },
    });
    const set = new Set(accounts.map((a) => a.provider));
    return {
        microsoft: set.has("azure-ad"),
        google: set.has("google"),
    };
}

// Optional per-user policy fields (wire later if/when you add them to Prisma)
export type OAuthPolicy = "ANY" | "MICROSOFT_ONLY" | "GOOGLE_ONLY" | "NONE";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserPolicy(userId: string): Promise<{
    passwordEnabled: boolean;
    oauthPolicy: OAuthPolicy;
}> {
    // If you don’t have these columns yet, default to permissive behavior.
    // Add them to Prisma when you want finer control:
    //   passwordEnabled Boolean @default(true)
    //   oauthPolicy     String  @default("ANY")
    return { passwordEnabled: true, oauthPolicy: "ANY" };
}
