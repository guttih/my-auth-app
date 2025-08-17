// src/components/User/ConnectedAccountsPanel.tsx
"use client";

import { useEffect, useState, useTransition } from "react"; // NEW
import { confirmDialog } from "../ui/ConfirmDialog/ConfirmDialog";
import { showMessageBox } from "@/components/ui/MessageBox/MessageBox";
import { ProviderId } from "@/lib/auth/provider-ids";
import { Button } from "../ui/Button/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";

type OAuthProviderId = typeof ProviderId.Google | typeof ProviderId.AzureAd | typeof ProviderId.Steam;

type LinkedAccount = {
    id: string;
    provider: OAuthProviderId | string;
    providerAccountId: string;
    label?: string;
    picture?: string;
};

type Props = {
    userId?: string; // admin view if present
    showConnectButtons?: boolean; // default true (self profile); false for admin
    allowUnlink?: boolean; // default true
};

function providerLabel(p: string) {
    if (p === ProviderId.Google) return "Google";
    if (p === ProviderId.AzureAd) return "Microsoft";
    if (p === ProviderId.Steam) return "Steam";
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
    const router = useRouter();
    const [isPending, startTransition] = useTransition(); // NEW

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

        // Optimistic UI — remove immediately
        const prev = accounts;
        setAccounts(prev.filter((a) => a.id !== id));

        const url = userId ? `/api/admin/users/${userId}/accounts/${id}` : `/api/user/self/accounts`;
        const init: RequestInit = userId
            ? { method: "DELETE" }
            : { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: id }) };

        try {
            const res = await fetch(url, init);
            if (!res.ok) {
                throw new Error((await res.json().catch(() => ({})))?.error ?? "Failed to unlink");
            }

            // Re-render server components so the Connect buttons become visible again
            startTransition(() => router.refresh()); // NEW

            // Optional: also reload here so this client list is fresh right now
            // await load();
        } catch (e) {
            // Roll back on failure
            setAccounts(prev);
            showMessageBox({
                variant: "error",
                title: "Problem",
                message: e instanceof Error ? e.message : "Failed to unlink",
                buttonText: "Close",
            });
        }
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

            {/* The page renders connect buttons; we refresh the page so it recomputes after unlink */}

            {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 grid place-items-center rounded-full bg-gray-600 text-white text-xs uppercase">
                            {providerInitial(a.provider)}
                        </span>
                        {a.picture ? (
                            <Image
                                src={a.picture || "/favicon.ico"}
                                alt={a.label || a.providerAccountId}
                                width={48}
                                height={48}
                                className="rounded-full ring-1 ring-gray-200"
                            />
                        ) : null}
                        <div className="flex flex-col">
                            <div className="font-medium">{providerLabel(a.provider)}</div>
                            <div className="text-sm opacity-75 font-mono">{a.label ?? a.providerAccountId}</div>
                        </div>
                    </div>

                    {a.provider === ProviderId.Steam && a.providerAccountId && (
                        <Button onClick={() => router.push("/profile/steam")} className="py-2 px-4" title="View">
                            View Steam Profile
                        </Button>
                    )}

                    {allowUnlink && (
                        <button className="text-sm underline disabled:opacity-60" onClick={() => unlink(a.id)} disabled={isPending}>
                            {isPending ? "Unlinking…" : "Unlink"}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
