// src/app/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SelfEditForm from "@/components/User/SelfEditForm";
import ConnectMicrosoftButton from "@/components/User/ConnectMicrosoftButton";
import ConnectGoogleButton from "@/components/User/ConnectGoogleButton";
import ConnectedAccountsPanel from "@/components/User/ConnectedAccountsPanel";
import ConnectSteamButton from "@/components/User/ConnectSteamButton";
import { ProviderId } from "@/lib/auth/provider-ids";
import Link from "next/link";

import { globalProviders } from "@/lib/auth/policy";
import { Button } from "@/components/ui/Button/Button";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const enabled = globalProviders();

    const showGoogle = enabled.google;
    const showMicrosoft = enabled[ProviderId.AzureAd];
    const showSteam = enabled.steam;
    const formId = "self-edit-form";
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-gray-600">Manage your account details and connected accounts.</p>
            <SelfEditForm formId={formId} /> {/* updated to accept formId and hide its internal Save */}
            <div className="flex gap-3">
                {showMicrosoft && <ConnectMicrosoftButton />}
                {showGoogle && <ConnectGoogleButton />}
                {showSteam && <ConnectSteamButton />}
            </div>
            <ConnectedAccountsPanel />
            <Button type="submit" form={formId} variant="important" className="w-full">
                Save
            </Button>
            <Link href="/dashboard">Dashboard</Link>
        </div>
    );
}
