"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        setLoading(false);

        if (res?.ok) {
            router.push("/dashboard");
        } else {
            setError("Invalid username or password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
            <div
                className="shadow-xl rounded-xl p-8 w-full max-w-md border"
                style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border)",
                }}
            >
                <h1 className="text-2xl font-semibold mb-6 text-center">Sign in</h1>

                {error && (
                    <div
                        className="p-3 mb-4 rounded text-sm text-center"
                        style={{
                            backgroundColor: "#fee2e2", // bg-red-100
                            color: "#b91c1c", // text-red-700
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
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
                        <label htmlFor="password" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
