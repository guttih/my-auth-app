// src/app/layout.tsx
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { Providers } from "./providers";
import ThemeInitializer from "@/components/ThemeInitializer";

export const metadata: Metadata = {
    title: "My Auth App",
    description: "Authentication with themes",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    const theme = session?.user?.theme || "light";

    return (
        <html lang="en" data-theme={theme}>
            <body>
                <ThemeInitializer />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
