// src/components/User/ConnectGoogleButton.tsx
"use client";
import { Button } from "@/components/ui/Button/Button";
import { signIn } from "next-auth/react";

export default function ConnectGoogleButton() {
    return (
        <Button
            onClick={() =>
                signIn("google", {
                    callbackUrl: "/profile?linked=google",
                    prompt: "select_account", // show account chooser while testing
                })
            }
            className="w-full py-2 px-4"
            title="Link your Google account to this user"
        >
            Connect Google account
        </Button>
    );
}
