// app/page.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Welcome, {session.user?.name}!</h1>
        <p className="mt-4">You're logged in.</p>
        <Link href="/dashboard" className="text-blue-500 underline mt-2 inline-block">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome to My Auth App</h1>
      <p className="mt-4">Please log in to continue.</p>
      <Link href="/login" className="text-blue-500 underline mt-2 inline-block">
        Go to login page
      </Link>
    </div>
  );
}
