// src/app/api/auth/providers/index.ts
import { credentialsProvider } from "./credentials";
import azureAdProvider from "./azure-ad";
import googleProvider from "./google";
import type { Provider } from "next-auth/providers";
import steamProvider from "./steam";
import { NextRequest } from "next/server";

function envBool(name: string, def = true) {
    const v = (process.env[name] ?? "").trim().toLowerCase();
    if (!v) return def;
    return !["false", "0", "no", "off"].includes(v);
}

export function getProviders(req?: NextRequest): Provider[] {
    const providers: Provider[] = [];

    const credentialsEnabled = envBool("AUTH_CREDENTIALS_ENABLED", true);
    if (credentialsEnabled) providers.push(credentialsProvider);

    if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
        providers.push(azureAdProvider());
    }

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        providers.push(googleProvider());
    }

    if (process.env.STEAM_SECRET && req) {
        providers.push(steamProvider(req));
    }

    return providers;
}

export default getProviders;
