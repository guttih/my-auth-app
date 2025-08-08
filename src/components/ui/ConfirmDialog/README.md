# ConfirmDialog UI Component

A simple, animated confirmation dialog component for React using Tailwind CSS and custom themes via CSS variables.

---

## ✅ Features

-   Promise-based confirmation (`true` / `false`)
-   Smooth in/out animations
-   Fully customizable title, message, and button texts
-   Theming support via CSS variables

---

## 📦 Installation

No dependencies beyond React and Tailwind required.  
Make sure you define the required CSS variables (see below).

---

## 🎨 Required CSS Variables

This component uses CSS custom properties to support themes. Add the following to your `globals.css`:

```css
:root {
    --card-bg: #ffffff;
    --foreground: #111827;
    --muted: #6b7280;
    --border: #e5e7eb;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
}
```

For dark/light theme support, use:

```css
html[data-theme="light"] {
    --card-bg: #ffffff;
    --foreground: #111827;
    --muted: #6b7280;
    --border: #e5e7eb;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
}

html[data-theme="dark"] {
    --card-bg: #1f2937;
    --foreground: #f9fafb;
    --muted: #9ca3af;
    --border: #374151;
    --accent: #4b5563;
    --accent-hover: #68707b;
}
```

---

## 💻 Usage

```tsx
import { confirmDialog } from "@/components/ui/ConfirmDialog";

const confirmed = await confirmDialog({
    title: "Are you sure?",
    message: "This action cannot be undone.",
    confirmText: "Yes, delete it",
    cancelText: "Cancel",
});
```

---

## 🧩 Props

| Option          | Type      | Default     | Description               |
| --------------- | --------- | ----------- | ------------------------- |
| `title`         | `string`  | —           | Title text                |
| `message`       | `string`  | —           | Message body              |
| `confirmText`   | `string`  | `"Confirm"` | Text for confirm button   |
| `cancelText`    | `string`  | `"Cancel"`  | Text for cancel button    |
| `withAnimation` | `boolean` | `true`      | Animate dialog open/close |

---

## 📍 Notes

-   The returned Promise resolves with `true` if the user confirms, and `false` otherwise.
-   Animations are controlled via Tailwind transitions and a `withAnimation` flag.
-   You must define the color variables either at root level or within a theme selector like `html[data-theme="dark"]`.

---

For consistent styling across components, reuse these CSS variables in other UI elements too.
