// src/app/profile/ConnectGoogleButton.tsx
"use client";
import { signIn } from "next-auth/react";

export default function ConnectGoogleButton() {
    return (
        <button
            onClick={() =>
                signIn("google", {
                    callbackUrl: "/profile?linked=google",
                    prompt: "select_account", // show account chooser while testing
                })
            }
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
            title="Link your Google account to this user"
        >
            Connect Google account
        </button>
    );
}
