// src/app/api/auth/providers/index.ts
import { credentialsProvider } from "./credentials";
import azureAdProvider from "./azure-ad";
import googleProvider from "./google";
import type { Provider } from "next-auth/providers";

const normalUserPassProviderEnabled: boolean = true; // toggle this to disable local user/password auth

export function getProviders(): Provider[] {
    const providers: Provider[] = [];

    if (normalUserPassProviderEnabled) {
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
