// src/app/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SelfEditForm from "@/components/User/SelfEditForm";
import ConnectMicrosoftButton from "@/components/User/ConnectMicrosoftButton";
import ConnectGoogleButton from "@/components/User/ConnectGoogleButton";
import ConnectedAccountsPanel from "@/components/User/ConnectedAccountsPanel";
import Link from "next/link";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-gray-600">Update your account details below.</p>
            <SelfEditForm />
            <div className="flex gap-3">
                <ConnectMicrosoftButton />
                <ConnectGoogleButton />
                <ConnectedAccountsPanel />
            </div>
            <Link href="/dashboard">Dashboard</Link>
        </div>
    );
}
