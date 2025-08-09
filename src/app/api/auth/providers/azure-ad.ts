// src/app/api/auth/providers/azure-ad.ts
import AzureADProvider from "next-auth/providers/azure-ad";

type AzureProfile = {
    sub?: string;
    id?: string;
    name?: string;
    email?: string;
    preferred_username?: string;
    // image/photo is not present in the OIDC userinfo by default
};

const azureAdProvider = () =>
    AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID || "common",
        authorization: {
            params: {
                prompt: "select_account", // <-- show account chooser every time
            },
        },
        profile(p: AzureProfile) {
            const email = p.email ?? p.preferred_username ?? null;
            return {
                id: p.sub ?? p.id!, // NextAuth requires an id
                name: p.name ?? null,
                email,
                image: null,
            };
        },
    });

export default azureAdProvider;
