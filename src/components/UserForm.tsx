// components/UserForm.tsx
"use client";

import { useState } from "react";

export interface UserFormProps {
    initialData?: {
        id?: string;
        username: string;
        email?: string;
        role?: string;
    };
    onSubmit: (data: { username: string; password?: string; email?: string; role?: string }) => void;
    showRole?: boolean;
    requirePassword?: boolean;
    isEditing?: boolean;
}

export default function UserForm({
    initialData = { username: "", email: "", role: "" },
    onSubmit,
    showRole = false,
    requirePassword = true,
    isEditing = false,
}: UserFormProps) {
    const [username, setUsername] = useState(initialData.username || "");
    const [email, setEmail] = useState(initialData.email || "");
    const [role, setRole] = useState(initialData.role || "");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ username, password: password || undefined, email, role });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-md mx-auto">
            <h2 className="text-lg font-semibold">{isEditing ? "Edit User" : "Create New User"}</h2>

            <div>
                <label className="block text-sm">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-sm">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
            </div>

            {requirePassword && (
                <div>
                    <label className="block text-sm">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder={isEditing ? "Leave blank to keep current password" : ""}
                        required={!isEditing}
                    />
                </div>
            )}

            {showRole && (
                <div>
                    <label className="block text-sm">Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded">
                        <option value="">Select role</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            )}

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {isEditing ? "Update User" : "Create User"}
            </button>
        </form>
    );
}
