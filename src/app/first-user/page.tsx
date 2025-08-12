// src/app/first-user/page.tsx
"use client";

import { useEffect, useState } from "react";
import UserForm from "@/components/User/UserForm";
import type { UserFormData } from "@/types/user";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function FirstUserPage() {
    const router = useRouter();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    // Guard the page: only show if there are no users
    useEffect(() => {
        (async () => {
            const res = await fetch("/api/system/install-state");
            if (!res.ok) {
                setAllowed(false);
                return;
            }
            const data = await res.json();
            setAllowed(data.needsFirstUser === true);
            if (!data.needsFirstUser) router.replace("/login");
        })();
    }, [router]);

    if (allowed === null) return <p>Loading…</p>;
    if (!allowed) return null;

    const handleSubmit = async (data: UserFormData) => {
        // role is ignored; server will force ADMIN
        const res = await fetch("/api/bootstrap/first-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password,
            }),
        });

        if (!res.ok) {
            const msg = await res.text();
            alert(msg || "Failed to create first user");
            return;
        }

        // Auto sign-in via your Credentials provider
        const login = await signIn("credentials", {
            username: data.username,
            password: data.password,
            redirect: false,
        });

        if (login?.error) {
            // User exists but couldn’t sign in (unlikely if credentials provider is wired)
            router.replace("/auth/signin");
            return;
        }

        router.replace("/dashboard");
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Create the first admin</h1>
            <p className="mb-4 text-sm opacity-80">
                This app has no users yet. Create the first account—this one will be an <strong>Admin</strong>.
            </p>

            {/* Hide role selection by not passing isAdmin; server enforces ADMIN */}
            <UserForm initialData={{ username: "", email: "", role: "ADMIN" }} isAdmin={false} onSubmit={handleSubmit} />
        </div>
    );
}
