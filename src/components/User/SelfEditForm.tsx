// src/components/User/SelfEditForm.tsx
"use client";

import { useEffect, useState } from "react";
import UserForm, { UserFormData } from "@/components/User/UserForm";

export default function SelfEditForm() {
    const [userData, setUserData] = useState<Partial<UserFormData> | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("/api/user/self")
            .then((res) => res.json())
            .then((data) => {
                // Only keep editable fields
                setUserData({
                    id: data.id,
                    username: data.username,
                    email: data.email,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load user data", err);
                setLoading(false);
            });
    }, []);

    async function handleSubmit(updatedData: UserFormData) {
        try {
            const { username, email, password } = updatedData;

            const res = await fetch("/api/user/self", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (!res.ok) {
                throw new Error("Update failed");
            }

            setMessage("Profile updated successfully ✅");
        } catch (err) {
            console.error(err);
            setMessage("Error updating profile ❌");
        }
    }

    if (loading) return <p>Loading...</p>;
    if (!userData) return <p>Unable to load user data.</p>;

    return (
        <>
            {message && <p className="text-sm text-center text-blue-600 mb-4">{message}</p>}
            <UserForm initialData={userData} isAdmin={false} onSubmit={handleSubmit} />
        </>
    );
}
