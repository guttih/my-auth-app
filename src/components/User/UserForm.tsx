// src/components/UserForm.tsx

import { useState } from "react";

interface UserFormProps {
    initialData?: Partial<UserFormData>;
    isAdmin?: boolean;
    onSubmit: (data: UserFormData) => void;
}

export interface UserFormData {
    id?: string;
    username: string;
    email?: string;
    password?: string;
    role?: "VIEWER" | "MODERATOR" | "ADMIN";
    authProvider?: "LOCAL" | "AD";
}

export default function UserForm({ initialData = {}, isAdmin = false, onSubmit }: UserFormProps) {
    const [formData, setFormData] = useState<UserFormData>({
        username: initialData.username || "",
        email: initialData.email || "",
        password: "",
        role: initialData.role || "VIEWER",
        authProvider: initialData.authProvider || "LOCAL",
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">{initialData.id ? "Edit User" : "Create User"}</h2>

            <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
                <input name="username" value={formData.username} onChange={handleChange} className="form-input" required />
            </label>

            <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
                <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className="form-input" />
            </label>

            {isAdmin && (
                <>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Role
                        <select name="role" value={formData.role} onChange={handleChange} className="form-input">
                            <option value="VIEWER">Viewer</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </label>

                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Auth Provider
                        <select name="authProvider" value={formData.authProvider} onChange={handleChange} className="form-input">
                            <option value="LOCAL">Local</option>
                            <option value="AD">Active Directory</option>
                        </select>
                    </label>
                </>
            )}

            <label className="block text-gray-700 text-sm font-bold mb-2">
                Password {initialData.id && "(leave blank to keep current)"}
                <input type="password" name="password" value={formData.password || ""} onChange={handleChange} className="form-input" />
            </label>

            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-500">
                Save
            </button>
        </form>
    );
}
