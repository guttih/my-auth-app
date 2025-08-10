"use client";
import { useEffect, useState } from "react";

type LinkedAccount = {
    id: string;
    provider: "google" | "azure-ad" | string;
    providerAccountId: string;
    label?: string; // email/username/name
    picture?: string; // google avatar if present
};

export default function ConnectedAccountsPanel() {
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await fetch("/api/user/self/accounts");
        const data = await res.json();
        setAccounts(data.accounts ?? []);
        setLoading(false);
    }

    async function unlink(id: string) {
        if (!confirm("Unlink this account?")) return;
        const res = await fetch("/api/user/self/accounts", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: id }),
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j?.error ?? "Failed to unlink");
            return;
        }
        load();
    }

    useEffect(() => {
        load();
    }, []);

    if (loading) return <div>Loading linked accounts…</div>;
    if (!accounts.length) return <div>No linked accounts yet.</div>;

    return (
        <div className="space-y-2">
            <h2 className="font-semibold">Linked accounts</h2>

            {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div className="flex items-center gap-3">
                        {/* Provider icon (optional) */}
                        <span className="w-6 h-6 grid place-items-center rounded-full bg-gray-600 text-white text-xs uppercase">
                            {a.provider === "google" ? "G" : a.provider === "azure-ad" ? "MS" : a.provider[0]}
                        </span>

                        {/* Avatar if present (google) */}
                        {a.picture ? <img src={a.picture} alt="" className="w-6 h-6 rounded-full" /> : null}

                        <div className="flex flex-col">
                            <div className="font-medium capitalize">{a.provider.replace("-", " ")}</div>
                            <div className="text-sm opacity-75 font-mono">{a.label ?? a.providerAccountId}</div>
                        </div>
                    </div>

                    <button className="text-sm underline" onClick={() => unlink(a.id)}>
                        Unlink
                    </button>
                </div>
            ))}
        </div>
    );
}
