'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", {
      username,  // ✅ matches your auth handler
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      alert("Login failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-w-sm mx-auto">
      <h1 className="text-xl font-bold">Login</h1>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        type="text"
        placeholder="Username"
        required
        className="border p-2 rounded"
      />
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        required
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">
        Login
      </button>
    </form>
  );
}
