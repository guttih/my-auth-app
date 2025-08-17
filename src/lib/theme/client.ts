// src/lib/theme/client.ts
"use client";

import { Theme } from "@prisma/client";

const STORAGE_KEY = "theme";
const HTML_ATTR = "data-theme";

export function getStoredTheme(): Theme | null {
    try {
        const t = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return t === Theme.light || t === Theme.dark ? t : null;
    } catch {
        return null;
    }
}

export function setTheme(theme: Theme) {
    document.documentElement.setAttribute(HTML_ATTR, theme);
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        /* ignore */
    }
}

export function detectInitialTheme(): Theme {
    const stored = getStoredTheme();
    if (stored) return stored;

    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

    return prefersDark ? Theme.dark : Theme.light;
}
