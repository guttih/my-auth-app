// src/lib/auth/provider-ids.ts

// Canonical NextAuth provider IDs for your app
export const ProviderId = {
    Credentials: "credentials",
    AzureAd: "azure-ad",
    Google: "google",
    Steam: "steam",
} as const;

export type ProviderId = (typeof ProviderId)[keyof typeof ProviderId];

// Helpful sub-type: only OAuth providers (exclude credentials)
export type OAuthProviderId = Exclude<ProviderId, typeof ProviderId.Credentials>;

// Label map (UI-friendly names)
export const ProviderLabel: Record<OAuthProviderId | typeof ProviderId.Credentials, string> = {
    [ProviderId.Credentials]: "Username & Password",
    [ProviderId.AzureAd]: "Microsoft",
    [ProviderId.Google]: "Google",
    [ProviderId.Steam]: "Steam",
};

// Type guard if you ever need it
export function isOAuthProviderId(x: ProviderId): x is OAuthProviderId {
    return x !== ProviderId.Credentials;
}
