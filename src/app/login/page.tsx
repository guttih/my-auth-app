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
    return useMemo(() => humanizeQueryError(raw), [params, raw]);
}

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [credError, setCredError] = useState("");

    const [providers, setProviders] = useState<ProvidersMap | null>(null);
    const [oauthLock, setOauthLock] = useState<"microsoft" | "google" | null>(null);
    // when set, we hide credentials and the other oauth option

    const router = useRouter();
    const oauthError = useAuthError();

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

        // 1) Preflight
        const pre = await fetch("/api/auth/preflight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        }).then((r) => r.json() as Promise<{ code: string | null }>);

        if (pre.code === "OAUTH_ONLY_MICROSOFT") {
            setOauthLock("microsoft");
            setSubmitting(false);
            setCredError("Your account is linked to Microsoft. Please use “Continue with Microsoft”.");
            return;
        }
        if (pre.code === "OAUTH_ONLY_GOOGLE") {
            setOauthLock("google");
            setSubmitting(false);
            setCredError("Your account is linked to Google. Please use “Continue with Google”.");
            return;
        }

        // 2) Proceed with credentials sign-in
        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        setSubmitting(false);

        if (res?.ok) {
            router.push("/dashboard");
        } else {
            setCredError("Invalid username or password");
        }
    };

    const startAzure = () => signIn("azure-ad", { callbackUrl: "/dashboard" });
    const startGoogle = () => signIn("google", { callbackUrl: "/dashboard" });

    // After preflight lock, show only the required provider
    const showAzure = hasAzure && (oauthLock ? oauthLock === "microsoft" : true);
    const showGoogle = hasGoogle && (oauthLock ? oauthLock === "google" : true);
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

                {(showAzure || showGoogle) && (
                    <div className="space-y-3">
                        {showAzure && (
                            <Button type="button" onClick={startAzure} className="w-full py-2 px-4" variant="secondary">
                                Continue with Microsoft
                            </Button>
                        )}
                        {showGoogle && (
                            <Button type="button" onClick={startGoogle} className="w-full py-2 px-4" variant="secondary">
                                Continue with Google
                            </Button>
                        )}
                    </div>
                )}

                {/* Divider only when both OAuth (visible) and credentials are visible */}
                {showCredentials && (showAzure || showGoogle) && (
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                        <span className="text-xs opacity-70">or</span>
                        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
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

                {providers && !hasAzure && !hasGoogle && !hasCredentials && (
                    <p className="text-sm text-center opacity-70">No sign-in methods are currently available. Please contact the administrator.</p>
                )}
            </div>
        </div>
    );
}
