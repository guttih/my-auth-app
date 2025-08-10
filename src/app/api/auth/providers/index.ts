// src/app/api/auth/providers/index.ts
import { credentialsProvider } from "./credentials";
import azureAdProvider from "./azure-ad";
import googleProvider from "./google";
import type { Provider } from "next-auth/providers";

function envBool(name: string, def = true) {
    const v = (process.env[name] ?? "").trim().toLowerCase();
    if (!v) return def;
    return !["false", "0", "no", "off"].includes(v);
}

const credentialsEnabled = envBool("AUTH_CREDENTIALS_ENABLED", true);

export function getProviders(): Provider[] {
    const providers: Provider[] = [];

    if (credentialsEnabled) {
        providers.push(credentialsProvider);
    }

    if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
        providers.push(azureAdProvider());
    }

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        providers.push(googleProvider());
    }

    return providers;
}

export default getProviders;
