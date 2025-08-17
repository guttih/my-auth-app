// src/components/User/ConnectSteamButton.tsx
"use client";
import { Button } from "@/components/ui/Button/Button";
import { signIn } from "next-auth/react";
import { ProviderId } from "@/lib/auth/provider-ids";

export default function ConnectSteamButton() {
    return (
        <Button
            onClick={() => signIn(ProviderId.Steam, { callbackUrl: "/profile?linked=steam" })}
            className="w-full py-2 px-4"
            title="Link your Steam account to this user"
        >
            Connect Steam
        </Button>
    );
}
