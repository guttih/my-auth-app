// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole, Role } from "@/utils/auth/accessControl";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminUserListPage() {
    const session = await getServerSession(authOptions);

    // 🛡️ Access control
    if (!session?.user || !hasRole(session.user, Role.ADMIN)) {
        redirect("/login"); // or a 403 page
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            authProvider: true,
            createdAt: true,
        },
    });

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">User Management</h1>
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Username</th>
                        <th className="border px-4 py-2">Email</th>
                        <th className="border px-4 py-2">Role</th>
                        <th className="border px-4 py-2">Auth</th>
                        <th className="border px-4 py-2">Created</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">{user.username}</td>
                            <td className="border px-4 py-2">{user.email}</td>
                            <td className="border px-4 py-2">{user.role}</td>
                            <td className="border px-4 py-2">{user.authProvider}</td>
                            <td className="border px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
