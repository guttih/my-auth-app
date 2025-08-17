// src/components/User/ConnectedAccountsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { confirmDialog } from "../ui/ConfirmDialog/ConfirmDialog";
import { showMessageBox } from "@/components/ui/MessageBox/MessageBox";
import { ProviderId } from "@/lib/auth/provider-ids";

type OAuthProviderId = typeof ProviderId.Google | typeof ProviderId.AzureAd | typeof ProviderId.Steam;

// What comes back from /accounts endpoints (NextAuth Account rows transformed)
type LinkedAccount = {
    id: string;
    provider: OAuthProviderId | string; // keep string fallback for safety
    providerAccountId: string;
    label?: string;
    picture?: string;
};

type Props = {
    userId?: string; // if present => admin view of that user
    showConnectButtons?: boolean; // default true (self profile); false for admin
    allowUnlink?: boolean; // default true
};

function providerLabel(p: string) {
    if (p === ProviderId.Google) return "Google";
    if (p === ProviderId.AzureAd) return "Microsoft";
    if (p === ProviderId.Steam) return "Steam";
    // fallback: prettify unknowns
    return p.replace(/-/g, " ");
}

function providerInitial(p: string) {
    if (p === ProviderId.Google) return "G";
    if (p === ProviderId.AzureAd) return "MS";
    if (p === ProviderId.Steam) return "S";
    return (p[0] ?? "?").toUpperCase();
}

export default function ConnectedAccountsPanel({ userId, showConnectButtons = true, allowUnlink = true }: Props) {
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const url = userId ? `/api/admin/users/${userId}/accounts` : `/api/user/self/accounts`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            setLoading(false);
            showMessageBox({
                variant: "error",
                title: "Problem",
                message: "Failed to load linked accounts.",
                buttonText: "Close",
            });
            return;
        }
        const data = await res.json();
        setAccounts((data.accounts ?? []) as LinkedAccount[]);
        setLoading(false);
    }

    async function unlink(id: string) {
        if (!allowUnlink) return;
        const ok = await confirmDialog({
            title: "Unlink account?",
            message: "Are you sure you want to unlink this account?",
            confirmText: "Yes, unlink",
            cancelText: "Cancel",
        });
        if (!ok) return;

        const res = await fetch(userId ? `/api/admin/users/${userId}/accounts/${id}` : `/api/user/self/accounts`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: userId ? undefined : JSON.stringify({ accountId: id }),
        });

        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            showMessageBox({
                variant: "error",
                title: "Problem",
                message: j?.error ?? "Failed to unlink",
                buttonText: "Close",
            });
            return;
        }
        load();
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    if (loading) return <div>Loading linked accounts…</div>;
    if (!accounts.length) return <div>No linked accounts.</div>;

    return (
        <div className="space-y-2">
            <h2 className="font-semibold">Linked accounts</h2>

            {/* optional connect buttons only for self profile — keep page in charge of rendering them */}
            {!userId && showConnectButtons && (
                <div className="flex gap-3">
                    {/* Intentionally left to the page to render e.g.
                    <ConnectMicrosoftButton />
                    <ConnectGoogleButton />
                    <ConnectSteamButton />
           */}
                </div>
            )}

            {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 grid place-items-center rounded-full bg-gray-600 text-white text-xs uppercase">
                            {providerInitial(a.provider)}
                        </span>
                        {a.picture ? <img src={a.picture} alt={`${providerLabel(a.provider)} avatar`} className="w-6 h-6 rounded-full" /> : null}
                        <div className="flex flex-col">
                            <div className="font-medium">{providerLabel(a.provider)}</div>
                            <div className="text-sm opacity-75 font-mono">{a.label ?? a.providerAccountId}</div>
                        </div>
                    </div>

                    {allowUnlink && (
                        <button className="text-sm underline" onClick={() => unlink(a.id)}>
                            Unlink
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
