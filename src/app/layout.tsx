// src/app/layout.tsx
import "./globals.css";
import { auth } from "@/auth";
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
    const session = await auth();
    const cookieTheme = (await cookies()).get("theme")?.value as Theme | undefined;

    // Priority: DB/session → cookie → 'light'
    const theme: Theme = (session?.user?.theme as Theme) || cookieTheme || "light";
    const isAuthed = Boolean(session?.user?.id);

    const noFlash = `
    (function () {
      try {
        var html = document.documentElement;
        if (html.getAttribute("data-auth") === "1") return; // DB is source of truth
        // If server already set a theme, respect it
        var ssr = html.getAttribute("data-theme");
        if (ssr === "light" || ssr === "dark") return;
        var t = localStorage.getItem("theme");
        if (t !== "light" && t !== "dark") {
          t = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
        }
        html.setAttribute("data-theme", t);
      } catch {}
    })();
  `;

    return (
        <html lang="en" data-theme={theme} data-auth={isAuthed ? "1" : "0"}>
            <head>
                <script dangerouslySetInnerHTML={{ __html: noFlash }} />
            </head>
            <body>
                {/* For authed users, mirror DB theme to localStorage so future guest views match */}
                <ThemeInitializer />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
