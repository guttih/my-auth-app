// src/components/User/ConnectMicrosoftButton.tsx
"use client";
import { Button } from "@/components/ui/Button/Button";
import { signIn } from "next-auth/react";

export default function ConnectMicrosoftButton() {
    return (
        <Button
            onClick={() => signIn("azure-ad", { callbackUrl: "/profile?linked=ms" })}
            className="w-full py-2 px-4"
            title="Link your Microsoft account to this user"
        >
            Connect Microsoft account
        </Button>
    );
}
