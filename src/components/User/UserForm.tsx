// src/components/User/UserForm.tsx

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload"; // adjust path as needed
import type { UserFormData } from "@/types/user";
interface UserFormProps {
    initialData?: Partial<UserFormData>;
    isAdmin?: boolean;
    onSubmit: (data: UserFormData) => void;
}

export default function UserForm({ initialData = {}, isAdmin = false, onSubmit }: UserFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        id: initialData.id,
        username: initialData.username || "",
        email: initialData.email || "",
        password: "",
        role: initialData.role || "VIEWER",
        authProvider: initialData.authProvider || "LOCAL",
        theme: initialData.theme || "light",
        profileImage: initialData.profileImage || "",
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        let profileImagePath = formData.profileImage;

        if (selectedFile && formData.id) {
            const uploadForm = new FormData();
            uploadForm.append("file", selectedFile);
            uploadForm.append("filename", `user-${formData.id}`);

            const res = await fetch("/api/upload/profile-image", {
                method: "POST",
                body: uploadForm,
            });

            if (res.ok) {
                const data = await res.json();
                profileImagePath = data.path;
            }
        }

        onSubmit({ ...formData, profileImage: profileImagePath });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-4">{initialData.id ? "Edit User" : "Create User"}</h2>

            {formData.id && <ImageUpload value={formData.profileImage} onChange={(file) => setSelectedFile(file)} filename={`user-${formData.id}`} />}

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

            <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                    Theme
                </label>
                <select
                    id="theme"
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
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
