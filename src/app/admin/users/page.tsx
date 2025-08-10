// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import UserForm from "@/components/User/UserForm";
import { UserFormData } from "@/types/user";
import { confirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserFormData[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/admin/users");
                if (!res.ok) throw new Error("Unauthorized or server error");
                const data = await res.json();
                setUsers(data);
            } catch (err: unknown) {
                if (err instanceof Error) setError(err.message);
                else setError("An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleFormSubmit = async (userData: UserFormData) => {
        const method = userData.id ? "PATCH" : "POST";
        const url = userData.id ? `/api/admin/users/${userData.id}` : "/api/admin/users";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (res.ok) {
            const updatedUser = await res.json();
            if (userData.id) {
                // update existing
                setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            } else {
                // add new
                setUsers((prev) => [...prev, updatedUser]);
            }
            setSelectedUser(null);
        } else {
            alert("Failed to save user");
        }
    };

    const handleDeleteUser = async (id: string) => {
        // if (!confirm("Are you sure you want to delete this user?")) return;

        const ok = await confirmDialog({
            title: "Delete user?",
            message: "Are you sure you want to delete this user? This cannot be undone.",
            confirmText: "Yes, delete",
            cancelText: "Cancel",
        });

        if (!ok) return;

        const res = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
            alert("Failed to delete user.");
        }
    };

    if (loading) return <p>Loading users…</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">User Management</h1>

                <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>

                <Button onClick={() => setSelectedUser({ username: "", email: "", role: "VIEWER" })} variant="important">
                    + New User
                </Button>
            </div>

            <table
                className="min-w-full border-collapse text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
            >
                <thead style={{ backgroundColor: "var(--card-bg)" }}>
                    <tr>
                        {["Username", "Email", "Role", "Auth", "Created", "Actions"].map((header) => (
                            <th key={header} className="border px-4 py-2" style={{ borderColor: "var(--border)" }}>
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedUser(user)}
                            style={{
                                backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--card-bg)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                            <td className="border px-4 py-2" style={{ borderColor: "var(--border)" }}>
                                {user.username}
                            </td>
                            <td className="border px-4 py-2" style={{ borderColor: "var(--border)" }}>
                                {user.email}
                            </td>
                            <td className="border px-4 py-2" style={{ borderColor: "var(--border)" }}>
                                {user.role}
                            </td>
                            <td className="border px-4 py-2" style={{ borderColor: "var(--border)" }}>
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                            </td>
                            <td className="border px-4 py-2 text-center" style={{ borderColor: "var(--border)" }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteUser(user.id!);
                                    }}
                                    className="font-bold text-sm"
                                    style={{ color: "red" }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedUser && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[var(--card-bg)] text-[var(--foreground)] rounded shadow-lg p-6 relative w-full max-w-xl">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl">
                            ×
                        </button>
                        <UserForm initialData={selectedUser} isAdmin={true} onSubmit={handleFormSubmit} />
                    </div>
                </div>
            )}
        </div>
    );
}
