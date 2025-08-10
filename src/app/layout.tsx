// src/app/layout.tsx
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { cookies } from "next/headers";
import ThemeInitializer from "@/components/ThemeInitializer";
import type { Theme } from "@prisma/client";

export const metadata: Metadata = {
    title: "My Auth App",
    description: "Authentication with themes",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    const cookieTheme = (await cookies()).get("theme")?.value as Theme | undefined;

    // Priority: DB/session → cookie → 'light'
    const theme: Theme = (session?.user?.theme as Theme) || cookieTheme || "light";
    const isAuthed = Boolean(session?.user?.id);

    return (
        <html lang="en" data-theme={theme} data-auth={isAuthed ? "1" : "0"}>
            <body>
                {/* Sync localStorage to the SSR theme on the client */}
                <ThemeInitializer />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
