// src/components/User/ConnectedAccountsPanel.tsx
"use client";
import { useEffect, useState } from "react";
import { confirmDialog } from "../ui/ConfirmDialog/ConfirmDialog";
import { showMessageBox } from "@/components/ui/MessageBox/MessageBox";

type LinkedAccount = {
    id: string;
    provider: "google" | "azure-ad" | string;
    providerAccountId: string;
    label?: string;
    picture?: string;
};

type Props = {
    userId?: string; // if present => admin view of that user
    showConnectButtons?: boolean; // default true (self profile); false for admin
    allowUnlink?: boolean; // default true
};

export default function ConnectedAccountsPanel({ userId, showConnectButtons = true, allowUnlink = true }: Props) {
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const url = userId ? `/api/admin/users/${userId}/accounts` : `/api/user/self/accounts`;
        const res = await fetch(url);
        const data = await res.json();
        setAccounts(data.accounts ?? []);
        setLoading(false);
    }

    async function unlink(id: string) {
        if (!allowUnlink) return;
        if (
            !(await confirmDialog({
                title: "Unlink account?",
                message: "Are you sure you want to unlink this account?",
                confirmText: "Yes, unlink",
                cancelText: "Cancel",
            }))
        )
            return;

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
    }, [userId]);

    if (loading) return <div>Loading linked accounts…</div>;
    if (!accounts.length) return <div>No linked accounts.</div>;

    return (
        <div className="space-y-2">
            <h2 className="font-semibold">Linked accounts</h2>

            {/* optional connect buttons only for self profile */}
            {!userId && showConnectButtons && (
                <div className="flex gap-3">
                    {/* reuse your existing buttons */}
                    {/* <ConnectMicrosoftButton /> */}
                    {/* <ConnectGoogleButton /> */}
                </div>
            )}

            {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 grid place-items-center rounded-full bg-gray-600 text-white text-xs uppercase">
                            {a.provider === "google" ? "G" : a.provider === "azure-ad" ? "MS" : a.provider[0]}
                        </span>
                        {a.picture ? <img src={a.picture} alt="" className="w-6 h-6 rounded-full" /> : null}
                        <div className="flex flex-col">
                            <div className="font-medium capitalize">{a.provider.replace("-", " ")}</div>
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
