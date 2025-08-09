// src/app/profile/ConnectMicrosoftButton.tsx
"use client";
import { signIn } from "next-auth/react";

export default function ConnectMicrosoftButton() {
    return (
        <button
            onClick={() => signIn("azure-ad", { callbackUrl: "/profile?linked=ms" })}
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
            title="Link your Microsoft account to this user"
        >
            Connect Microsoft account
        </button>
    );
}
