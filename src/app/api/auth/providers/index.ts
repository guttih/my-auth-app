// src/app/api/auth/providers/index.ts
import type { Provider } from "next-auth/providers";
import type { NextRequest } from "next/server";
import { credentialsProvider } from "./credentials";
import azureAdProvider from "./azure-ad";
import googleProvider from "./google";
import steamProvider from "./steam";

function envBool(name: string, def = true) {
    const v = (process.env[name] ?? "").trim().toLowerCase();
    if (!v) return def;
    return !["false", "0", "no", "off"].includes(v);
}

export function getProviders(req?: NextRequest): Provider[] {
    const providers: Provider[] = [];

    if (envBool("AUTH_CREDENTIALS_ENABLED", true)) providers.push(credentialsProvider);

    if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
        providers.push(azureAdProvider());
    }

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        providers.push(googleProvider());
    }

    if (process.env.STEAM_SECRET && process.env.STEAM_API_KEY) {
        providers.push(steamProvider(req)); // req optional; steamProvider handles fallback
    }

    return providers;
}

export default getProviders;
