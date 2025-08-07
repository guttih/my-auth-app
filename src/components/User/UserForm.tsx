// src/components/User/UserForm.tsx

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
        id: initialData.id,
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-4">{initialData.id ? "Edit User" : "Create User"}</h2>

            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                </label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {isAdmin && (
                <>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="VIEWER">Viewer</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="authProvider" className="block text-sm font-medium text-gray-700">
                            Auth Provider
                        </label>
                        <select
                            id="authProvider"
                            name="authProvider"
                            value={formData.authProvider}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="LOCAL">Local</option>
                            <option value="AD">Active Directory</option>
                        </select>
                    </div>
                </>
            )}

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password {initialData.id && <span className="text-gray-400">(leave blank to keep current)</span>}
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <button type="submit" className="w-full py-2 px-4 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Save
            </button>
        </form>
    );
}
