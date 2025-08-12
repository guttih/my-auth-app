// src/app/login/page.tsx
"use client";

import { Button } from "@/components/ui/Button/Button";
import { signIn, getProviders as getNextAuthProviders } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProvidersMap = Record<string, { id: string; name: string; type: string; signinUrl: string; callbackUrl: string }>;

function humanizeQueryError(raw?: string | null) {
    if (!raw) return "";
    switch (raw) {
        case "OAUTH_ONLY_MICROSOFT":
            return "Your account is linked to Microsoft. Please use “Continue with Microsoft”.";
        case "OAUTH_ONLY_GOOGLE":
            return "Your account is linked to Google. Please use “Continue with Google”.";
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
        case "EmailCreateAccount":
        case "Callback":
            return "Something went wrong during Microsoft/Google sign-in. Please try again.";
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
    const [oauthLock, setOauthLock] = useState<"microsoft" | "google" | "both" | null>(null);
    // when set, we hide credentials and the other oauth option

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

    // derive what to show
    const hasAzure = !!providers?.["azure-ad"];
    const hasGoogle = !!providers?.["google"];
    const hasCredentials = !!providers?.["credentials"];

    // If the user changes username, clear any locks/errors
    useEffect(() => {
        setOauthLock(null);
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
            const pre: { code: "OAUTH_ONLY" | "OAUTH_ONLY_MICROSOFT" | "OAUTH_ONLY_GOOGLE" | null; providers?: ("microsoft" | "google")[] } =
                await res.json();

            if (pre.code) {
                setSubmitting(false);

                if (pre.code === "OAUTH_ONLY_MICROSOFT") {
                    setOauthLock("microsoft");
                    setCredError("This account uses OAuth. Please continue with Microsoft.");
                } else if (pre.code === "OAUTH_ONLY_GOOGLE") {
                    setOauthLock("google");
                    setCredError("This account uses OAuth. Please continue with Google.");
                } else {
                    // OAUTH_ONLY with providers array (both)
                    setOauthLock("both");
                    setCredError("This account uses OAuth. Please continue with Microsoft or Google.");
                }
                return;
            }

            const result = await signIn("credentials", { username: uname, password, redirect: false });
            setSubmitting(false);

            if (result?.ok) {
                try {
                    const me = await fetch("/api/user/self", { cache: "no-store" }).then((r) => r.json());
                    if (me?.theme) localStorage.setItem("theme", me.theme);
                    const html = document.documentElement;
                    html.setAttribute("data-theme", me.theme || "light");
                } catch {
                    /* non-fatal */
                }

                router.push("/dashboard");
            } else setCredError("Invalid username or password");
        } catch {
            setSubmitting(false);
            setCredError("Network error. Please try again.");
        }
    };

    const startAzure = () => signIn("azure-ad", { callbackUrl: "/dashboard" });
    const startGoogle = () => signIn("google", { callbackUrl: "/dashboard" });

    // After preflight lock, show only the required provider
    const showAzure = hasAzure && (oauthLock === null || oauthLock === "microsoft" || oauthLock === "both");
    const showGoogle = hasGoogle && (oauthLock === null || oauthLock === "google" || oauthLock === "both");
    const showCredentials = hasCredentials && oauthLock === null;

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
                {showCredentials && (showAzure || showGoogle) && (
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                        <span className="text-xs opacity-70">or</span>
                        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                    </div>
                )}
                {(showAzure || showGoogle) && (
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
                    </div>
                )}

                {providers && !hasAzure && !hasGoogle && !hasCredentials && (
                    <p className="text-sm text-center opacity-70">No sign-in methods are currently available. Please contact the administrator.</p>
                )}
            </div>
        </div>
    );
}
