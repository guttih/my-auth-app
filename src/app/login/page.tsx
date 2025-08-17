// src/app/login/page.tsx
"use client";

import { Button } from "@/components/ui/Button/Button";
import { signIn, getProviders as getNextAuthProviders } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/** Canonical NextAuth provider IDs used in UI + account.provider */
const ProviderId = {
    Credentials: "credentials",
    AzureAd: "azure-ad",
    Google: "google",
    Steam: "steam",
} as const;
type ProviderId = (typeof ProviderId)[keyof typeof ProviderId];
type OAuthProviderId = Exclude<ProviderId, typeof ProviderId.Credentials>;

type ProvidersMap = Record<string, { id: string; name: string; type: string; signinUrl: string; callbackUrl: string }>;

function humanizeQueryError(raw?: string | null) {
    if (!raw) return "";
    switch (raw) {
        case "OAUTH_ONLY_MICROSOFT":
            return "Your account is linked to Microsoft. Please use “Continue with Microsoft”.";
        case "OAUTH_ONLY_GOOGLE":
            return "Your account is linked to Google. Please use “Continue with Google”.";
        case "OAUTH_ONLY_STEAM":
            return "Your account is linked to Steam. Please use “Continue with Steam”.";
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
        case "EmailCreateAccount":
        case "Callback":
            return "Something went wrong during sign-in. Please try again.";
        case "CredentialsSignin":
            return "Invalid username or password.";
        default:
            return "Sign-in failed. Please try again.";
    }
}

function useAuthError() {
    const params = useSearchParams();
    const raw = params.get("error");
    return useMemo(() => humanizeQueryError(raw), [raw]);
}

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [credError, setCredError] = useState("");

    const [providers, setProviders] = useState<ProvidersMap | null>(null);

    // Instead of "both", hold the precise set of allowed OAuth providers from preflight.
    // null = no lock (credentials allowed); Set([...]) = only those OAuths allowed.
    const [oauthLockSet, setOauthLockSet] = useState<Set<OAuthProviderId> | null>(null);

    const router = useRouter();
    const oauthError = useAuthError();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/system/install-state", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (mounted && data?.needsFirstUser) router.replace("/first-user");
            } catch {
                /* ignore */
            }
        })();
        return () => {
            mounted = false;
        };
    }, [router]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const p = (await getNextAuthProviders()) as ProvidersMap | null;
            if (mounted) setProviders(p);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // derive what the server says is globally available
    const hasAzure = !!providers?.[ProviderId.AzureAd];
    const hasGoogle = !!providers?.[ProviderId.Google];
    const hasSteam = !!providers?.[ProviderId.Steam];
    const hasCredentials = !!providers?.[ProviderId.Credentials];

    // If the user changes username, clear any locks/errors
    useEffect(() => {
        setOauthLockSet(null);
        setCredError("");
    }, [username]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setCredError("");

        const uname = username.trim();

        try {
            const res = await fetch("/api/auth/preflight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: uname }),
            });

            // Preflight contract (updated to include Steam + list of allowed OAuths)
            const pre: {
                code: "OAUTH_ONLY" | "OAUTH_ONLY_MICROSOFT" | "OAUTH_ONLY_GOOGLE" | "OAUTH_ONLY_STEAM" | null;
                providers?: Array<"microsoft" | "google" | "steam">;
            } = await res.json();

            if (pre.code) {
                setSubmitting(false);

                // Build a set of allowed OAuth providers from the response
                const allowed = new Set<OAuthProviderId>();
                if (pre.code === "OAUTH_ONLY_MICROSOFT") allowed.add(ProviderId.AzureAd);
                else if (pre.code === "OAUTH_ONLY_GOOGLE") allowed.add(ProviderId.Google);
                else if (pre.code === "OAUTH_ONLY_STEAM") allowed.add(ProviderId.Steam);
                else {
                    // Generic OAUTH_ONLY with array
                    (pre.providers ?? []).forEach((p) => {
                        if (p === "microsoft") allowed.add(ProviderId.AzureAd);
                        else if (p === "google") allowed.add(ProviderId.Google);
                        else if (p === "steam") allowed.add(ProviderId.Steam);
                    });
                }
                setOauthLockSet(allowed);

                // Friendly message
                const labels = Array.from(allowed).map((p) =>
                    p === ProviderId.AzureAd ? "Microsoft" : p === ProviderId.Google ? "Google" : "Steam"
                );
                if (labels.length === 1) {
                    setCredError(`This account uses OAuth. Please continue with ${labels[0]}.`);
                } else {
                    setCredError(`This account uses OAuth. Please continue with ${labels.join(" or ")}.`);
                }
                return;
            }

            const result = await signIn(ProviderId.Credentials, {
                username: uname,
                password,
                redirect: false,
            });
            setSubmitting(false);

            if (result?.ok) {
                try {
                    const me = await fetch("/api/user/self", { cache: "no-store" }).then((r) => r.json());
                    if (me?.theme) localStorage.setItem("theme", me.theme);
                    document.documentElement.setAttribute("data-theme", me.theme || "light");
                } catch {
                    /* non-fatal */
                }
                router.push("/dashboard");
            } else {
                setCredError("Invalid username or password");
            }
        } catch {
            setSubmitting(false);
            setCredError("Network error. Please try again.");
        }
    };

    const startAzure = () => signIn(ProviderId.AzureAd, { callbackUrl: "/dashboard" });
    const startGoogle = () => signIn(ProviderId.Google, { callbackUrl: "/dashboard" });
    const startSteam = () => signIn(ProviderId.Steam, { callbackUrl: "/dashboard" });

    // Visibility based on global availability AND the lock set (if present)
    const locked = oauthLockSet !== null;
    const showCredentials = hasCredentials && !locked;

    const showAzure = hasAzure && (!locked || oauthLockSet!.has(ProviderId.AzureAd));
    const showGoogle = hasGoogle && (!locked || oauthLockSet!.has(ProviderId.Google));
    const showSteam = hasSteam && (!locked || oauthLockSet!.has(ProviderId.Steam));

    const anyOAuthVisible = showAzure || showGoogle || showSteam;

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
            <div
                className="shadow-xl rounded-xl p-8 w-full max-w-md border space-y-6"
                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}
            >
                <h1 className="text-2xl font-semibold text-center">Sign in</h1>

                {(oauthError || credError) && (
                    <div className="p-3 rounded text-sm text-center" style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}>
                        {oauthError || credError}
                    </div>
                )}

                {showCredentials && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                style={{ backgroundColor: "var(--input-bg)", color: "var(--foreground)", borderColor: "var(--border)" }}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                style={{ backgroundColor: "var(--input-bg)", color: "var(--foreground)", borderColor: "var(--border)" }}
                            />
                        </div>

                        <Button type="submit" disabled={submitting} className="w-full py-2 px-4">
                            {submitting ? "Signing in…" : "Sign In"}
                        </Button>
                    </form>
                )}

                {/* Divider only when both OAuth (visible) and credentials are visible */}
                {showCredentials && anyOAuthVisible && (
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                        <span className="text-xs opacity-70">or</span>
                        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                    </div>
                )}

                {anyOAuthVisible && (
                    <div className="space-y-3">
                        {showAzure && (
                            <Button type="button" onClick={startAzure} className="w-full py-2 px-4">
                                Continue with Microsoft
                            </Button>
                        )}
                        {showGoogle && (
                            <Button type="button" onClick={startGoogle} className="w-full py-2 px-4">
                                Continue with Google
                            </Button>
                        )}
                        {showSteam && (
                            <Button type="button" onClick={startSteam} className="w-full py-2 px-4">
                                Continue with Steam
                            </Button>
                        )}
                    </div>
                )}

                {providers && !hasAzure && !hasGoogle && !hasSteam && !hasCredentials && (
                    <p className="text-sm text-center opacity-70">No sign-in methods are currently available. Please contact the administrator.</p>
                )}
            </div>
        </div>
    );
}
