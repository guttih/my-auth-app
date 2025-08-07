// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import UserForm, { UserFormData } from "@/components/User/UserForm";
import { confirmDialog } from "@/components/ConfirmDialog";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserFormData[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/admin/users");
                if (!res.ok) throw new Error("Unauthorized or server error");
                const data = await res.json();
                setUsers(data);
            } catch (err: any) {
                setError(err.message);
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
                <button
                    onClick={() => setSelectedUser({ username: "", email: "", role: "VIEWER", authProvider: "LOCAL" })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm"
                >
                    + New User
                </button>
            </div>

            <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Username</th>
                        <th className="border px-4 py-2">Email</th>
                        <th className="border px-4 py-2">Role</th>
                        <th className="border px-4 py-2">Auth</th>
                        <th className="border px-4 py-2">Created</th>
                        <th className="border px-4 py-2">Actions</th> {/* 👈 Add this */}
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                            <td className="border px-4 py-2">{user.username}</td>
                            <td className="border px-4 py-2">{user.email}</td>
                            <td className="border px-4 py-2">{user.role}</td>
                            <td className="border px-4 py-2">{user.authProvider}</td>
                            <td className="border px-4 py-2">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                            <td className="border px-4 py-2 text-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteUser(user.id!);
                                    }}
                                    className="text-red-600 hover:text-red-800 font-bold text-sm"
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
                    <div className="bg-white rounded shadow-lg p-6 relative w-full max-w-xl">
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
