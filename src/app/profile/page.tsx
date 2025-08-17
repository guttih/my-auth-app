// src/app/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SelfEditForm from "@/components/User/SelfEditForm";
import ConnectMicrosoftButton from "@/components/User/ConnectMicrosoftButton";
import ConnectGoogleButton from "@/components/User/ConnectGoogleButton";
import ConnectedAccountsPanel from "@/components/User/ConnectedAccountsPanel";
import ConnectSteamButton from "@/components/User/ConnectSteamButton";
import Link from "next/link";

// ✅ reuse your env-driven provider list
import { getProviders as getAuthProviders } from "@/app/api/auth/providers";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const providers = getAuthProviders();
    // Only consider oauth providers for linking
    const enabled = new Set(providers.filter((p: any) => p.type === "oidc").map((p: any) => p.id as string));

    const showGoogle = enabled.has("google");
    const showMicrosoft = enabled.has("azure-ad");
    const showSteam = enabled.has("steam");

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-gray-600">Update your account details below.</p>

            <SelfEditForm />

            <div className="flex gap-3">
                {showMicrosoft && <ConnectMicrosoftButton />}
                {showGoogle && <ConnectGoogleButton />}
                {showSteam && <ConnectSteamButton />}
                <ConnectedAccountsPanel />
            </div>

            <Link href="/dashboard">Dashboard</Link>
        </div>
    );
}
