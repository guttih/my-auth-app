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

    function userRoleDescription(role: string | undefined): string {
        switch (role) {
            case "ADMIN":
                return "Administrator with full access";
            case "MODERATOR":
                return "Moderator with limited access";
            case "VIEWER":
                return "Viewer with read-only access";
            default:
                return "User with no specific role";
        }
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Welcome to your dashboard 👋</h1>
            <p className="text-gray-600">This page is only accessible to logged-in users.</p>
            <h1 className="text-red-500 text-3xl font-bold">Tailwind is working</h1>
            {/* 🛡Let's️ show user what his user role is */}
            <p className="text-gray-600">
                User {session.user.id} is signed in as {session.user.username} / with role: {userRoleDescription(session.user.role)}.
            </p>
            <LogoutButton />
        </div>
    );
}
