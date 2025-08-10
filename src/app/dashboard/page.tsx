// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    function userRoleDescription(role: string | undefined): string {
        switch (role) {
            case "ADMIN":
                return "administrator with full access";
            case "MODERATOR":
                return "moderator with limited access";
            case "VIEWER":
                return "viewer with read-only access";
            default:
                return "user with no specific role";
        }
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Welcome to your dashboard 👋</h1>
            <p>
                User {session.user.name} logged in as {userRoleDescription(session.user.role)}.
            </p>
            <Link href="/profile" className="hover:underline">
                Profile
            </Link>
            {/* let's create a link to the admin/users page if user is admin */}
            {session.user.role === "ADMIN" && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mt-4">Admin Panel</h3>
                    <p className="">
                        <Link href="/admin/users" className="hover:underline">
                            User Management
                        </Link>
                    </p>
                </div>
            )}
            <LogoutButton />
        </div>
    );
}
