// src/components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-blue-600 hover:underline">
            Logout
        </button>
    );
}
