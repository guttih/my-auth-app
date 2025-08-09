// src/app/login/page.tsx
"use client";

import { Button } from "@/components/ui/Button/Button";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function useAuthError() {
    const params = useSearchParams();
    const raw = params.get("error");
    return useMemo(() => {
        if (!raw) return "";
        // Friendly messages for common NextAuth errors
        switch (raw) {
            case "OAuthSignin":
            case "OAuthCallback":
            case "OAuthCreateAccount":
            case "EmailCreateAccount":
            case "Callback":
                return "Something went wrong during Microsoft sign-in. Please try again.";
            case "CredentialsSignin":
                return "Invalid username or password.";
            default:
                return "Sign-in failed. Please try again.";
        }
    }, [params]);
}

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const router = useRouter();
    const oauthError = useAuthError();
    const [credError, setCredError] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setCredError("");

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        setSubmitting(false);

        if (res?.ok) {
            router.push("/dashboard"); // keep your existing post-login target
        } else {
            setCredError("Invalid username or password");
        }
    };

    const startAzure = () => signIn("azure-ad", { callbackUrl: "/dashboard" }); // or "/profile" if you prefer

    // If/when you enable Google provider:
    const startGoogle = () => signIn("google", { callbackUrl: "/dashboard" });

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

                {/* OAuth buttons */}
                <div className="space-y-3">
                    <Button
                        type="button"
                        onClick={startAzure}
                        className="w-full py-2 px-4"
                        variant="secondary" // if your Button supports variants
                    >
                        Continue with Microsoft
                    </Button>

                    {/* Uncomment when Google provider is enabled
          <Button
            type="button"
            onClick={startGoogle}
            className="w-full py-2 px-4"
            variant="secondary"
          >
            Continue with Google
          </Button>
          */}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                    <span className="text-xs opacity-70">or</span>
                    <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                </div>

                {/* Credentials form (unchanged) */}
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
                            style={{
                                backgroundColor: "var(--input-bg)",
                                color: "var(--foreground)",
                                borderColor: "var(--border)",
                            }}
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
                            style={{
                                backgroundColor: "var(--input-bg)",
                                color: "var(--foreground)",
                                borderColor: "var(--border)",
                            }}
                        />
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full py-2 px-4">
                        {submitting ? "Signing in…" : "Sign In"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
