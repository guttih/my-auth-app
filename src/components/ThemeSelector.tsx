"use client";

import { useEffect, useState } from "react";
import { Theme } from "@prisma/client";

const availableThemes = Object.values(Theme); // ["light", "dark"]

export default function ThemeSelector() {
    const [currentTheme, setCurrentTheme] = useState<Theme>("light");

    useEffect(() => {
        const htmlTheme = document.documentElement.dataset.theme;
        if (htmlTheme && availableThemes.includes(htmlTheme as Theme)) {
            setCurrentTheme(htmlTheme as Theme);
        }
    }, []);

    const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme;

        // Apply immediately
        document.documentElement.dataset.theme = newTheme;
        setCurrentTheme(newTheme);
        localStorage.setItem("theme", newTheme); // 👈 add this line

        try {
            await fetch("/api/user/self", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ theme: newTheme }),
            });
        } catch (err) {
            console.error("Failed to update theme", err);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="theme" className="text-sm text-gray-700">
                Theme:
            </label>
            <select id="theme" value={currentTheme} onChange={handleThemeChange} className="px-2 py-1 border rounded-md text-sm">
                {availableThemes.map((theme) => (
                    <option key={theme} value={theme}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    );
}
