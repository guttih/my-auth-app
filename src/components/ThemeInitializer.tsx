"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
            document.documentElement.setAttribute("data-theme", storedTheme);
        }
    }, []);

    return null; // no UI
}
