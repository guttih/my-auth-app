// src/components/ThemeInitializer.tsx
"use client";

import { useEffect } from "react";
import type { Theme } from "@prisma/client";

export default function ThemeInitializer() {
    useEffect(() => {
        const html = document.documentElement;
        const ssrTheme = (html.getAttribute("data-theme") || "light") as Theme;
        const isAuthed = html.getAttribute("data-auth") === "1";
        const stored = localStorage.getItem("theme") as Theme | null;

        if (isAuthed) {
            // Logged in: DB is source of truth. Persist it to localStorage.
            if (stored !== ssrTheme) {
                localStorage.setItem("theme", ssrTheme);
            }
            // DOM already matches SSR.
            return;
        }

        // Not logged in: let localStorage drive the DOM if present.
        if (stored && stored !== ssrTheme) {
            html.setAttribute("data-theme", stored);
        }
    }, []);

    return null;
}
