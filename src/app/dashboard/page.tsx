// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Welcome to your dashboard 👋</h1>
            <p className="text-gray-600">This page is only accessible to logged-in users.</p>

            <LogoutButton />
        </div>
    );
}
