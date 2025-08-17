"use client";

import { useState } from "react";
import { Button } from "../ui/Button/Button";

export default function CopySteamIdButton({ steamid }: { steamid: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(steamid);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // Fallback so users without Clipboard API still can copy
            window.prompt("Copy SteamID64:", steamid);
        }
    }

    return (
        <Button
            type="button"
            onClick={handleCopy}
            title="Copy SteamID64"
            aria-label="Copy SteamID64"
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50 shrink-0"
        >
            {copied ? "Copied!" : "Copy ID"}
        </Button>
    );
}
