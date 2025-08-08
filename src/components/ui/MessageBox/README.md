# MessageBox UI Component

A lightweight and flexible message box (modal or toast) component for React projects using Tailwind CSS.

---

## ✅ Features

-   Theme-aware (light/dark)
-   Modal or toast positioning
-   Auto-close after timeout (optional)
-   Smooth animation (optional)
-   Fully customizable variants
-   Promise-based resolution

---

## 📦 Installation

No external libraries needed, just ensure Tailwind and `react-dom/client` are available.

---

## 🎨 Required CSS Variables

This component relies on **CSS custom properties (variables)** for all its colors.  
You **must define them** in your `globals.css` file — typically using theme selectors like `html[data-theme='light']`.

If you're not using themes, you can still define them under `:root`.

### 👉 Example `globals.css` setup:

```css
/* src/app/globals.css */

:root {
    --msgbox-bg-error: #ce1e1e;
    --msgbox-text-error: #ebe9d8;
    --msgbox-bg-warning: #d9d904;
    --msgbox-text-warning: #c84300;
    --msgbox-bg-success: #026023;
    --msgbox-text-success: #c4d2c9;
    --msgbox-bg-info: #2563eb;
    --msgbox-text-info: #ffffff;
    --msgbox-bg-secondary: #e5e7eb;
    --msgbox-text-secondary: #374151;
    --msgbox-bg-default: #f3f4f6;
    --msgbox-text-default: #111827;
}
```

> ✅ Required even for minimal use — this is how the component gets its background and text color.

If you are using **dark/light themes**, define these inside your theme selectors:

```css
html[data-theme="light"] {
    --msgbox-bg-error: #ce1e1e;
    --msgbox-text-error: #ebe9d8;
    --msgbox-bg-warning: #d9d904;
    --msgbox-text-warning: #c84300;
    --msgbox-bg-success: #026023;
    --msgbox-text-success: #c4d2c9;
    --msgbox-bg-info: var(--accent);
    --msgbox-text-info: var(--button-text);
    --msgbox-bg-secondary: #e5e7eb;
    --msgbox-text-secondary: #374151;
    --msgbox-bg-default: #f3f4f6;
    --msgbox-text-default: #111827;
    /* ... */
}

html[data-theme="dark"] {
    --msgbox-bg-error: #7f1d1d;
    --msgbox-text-error: #fecaca;
    --msgbox-bg-warning: #92400e;
    --msgbox-text-warning: #fef08a;
    --msgbox-bg-success: #166534;
    --msgbox-text-success: #bbf7d0;

    --msgbox-bg-info: #374151;
    --msgbox-text-info: #e5e7eb;
    --msgbox-bg-secondary: #1e3a8a;
    --msgbox-text-secondary: #bfdbfe;

    --msgbox-bg-default: #1f2937;
    --msgbox-text-default: #f3f4f6;
    /* ... */
}
```

---

## 💻 Usage

```tsx
import { showMessageBox } from "@/components/ui/MessageBox";

await showMessageBox({
    title: "Uh-oh!",
    message: "Something went terribly wrong 😱",
    variant: "error", // optional
    blocking: true, // optional
    toast: false, // optional
    displayTime: 3000, // optional (in ms)
    position: "bottom-right", // optional
});
```

---

## 🧩 Props (Options)

| Option               | Type                                                                             | Default         | Description                                 |
| -------------------- | -------------------------------------------------------------------------------- | --------------- | ------------------------------------------- |
| `title`              | `string`                                                                         | —               | Title shown in the message box              |
| `message`            | `string`                                                                         | —               | Message body                                |
| `variant`            | `"information" \| "error" \| "warning" \| "success" \| "secondary" \| "default"` | `"information"` | Color styling                               |
| `displayTime`        | `number \| null`                                                                 | `null`          | Auto-close after milliseconds               |
| `position`           | `"center" \| "bottom-right" \| "top-left" \| ...`                                | `"center"`      | Where to position the box                   |
| `toast`              | `boolean`                                                                        | `false`         | Use toast-style positioning (no backdrop)   |
| `blocking`           | `boolean`                                                                        | `true`          | Disable interaction with the background     |
| `withAnimation`      | `boolean`                                                                        | `true`          | Animate in/out transitions                  |
| `buttonText`         | `string`                                                                         | `"OK"`          | Shown on the dismiss button                 |
| `preserveLineBreaks` | `boolean`                                                                        | `false`         | Use `white-space: pre-line` in message body |

---

## 📍 Notes

-   The `showMessageBox()` call returns a `Promise<void>` that resolves when the user closes the box or it auto-closes.
-   For `toast: true`, the message will slide in from the specified corner with no backdrop.
-   This component is theme-ready by design. If you're porting it to a non-themed project, make sure to define all variables under `:root`.

---

Want to support more variants like “celebration” or “despair”? Add more `variant` cases and CSS variables — you wild UX visionary, you.
