// src/components/ui/MessageBox.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";

interface MessageBoxOptions {
    title: string;
    message: string;
    variant?: "information" | "error" | "warning" | "success" | "secondary" | "default";
    displayTime?: number | null;
    position?: "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left";
    toast?: boolean;
    blocking?: boolean;
    withAnimation?: boolean;
    buttonText?: string;
    preserveLineBreaks?: boolean;
}

export function showMessageBox(rawOptions: MessageBoxOptions): Promise<void> {
    const options = {
        variant: "information",
        displayTime: null,
        position: "center",
        toast: false,
        blocking: true,
        withAnimation: true,
        buttonText: "OK",
        preserveLineBreaks: false,
        ...rawOptions,
    };

    const { title, message, variant, displayTime, position, toast, blocking, withAnimation, buttonText, preserveLineBreaks } = options;

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    return new Promise<void>((resolve) => {
        const MessageBoxComponent = () => {
            const [shouldAnimate, setShouldAnimate] = useState(false);
            const [isClosing, setIsClosing] = useState(false);

            useEffect(() => {
                const frame = requestAnimationFrame(() => {
                    setShouldAnimate(true);
                });
                return () => cancelAnimationFrame(frame);
            }, []);

            useEffect(() => {
                if (isClosing) {
                    const timeout = setTimeout(() => {
                        root.unmount();
                        container.remove();
                    }, 200);
                    return () => clearTimeout(timeout);
                }
            }, [isClosing]);

            useEffect(() => {
                if (displayTime !== null) {
                    const autoClose = setTimeout(() => {
                        setIsClosing(true);
                        setTimeout(() => resolve(), 200);
                    }, displayTime);
                    return () => clearTimeout(autoClose);
                }
            }, []);

            const handleClose = () => {
                setIsClosing(true);
                setTimeout(() => resolve(), 200);
            };

            const getVariantStyles = () => {
                switch (variant) {
                    case "error":
                        return "bg-[var(--msgbox-bg-error)] text-[var(--msgbox-text-error)]";
                    case "warning":
                        return "bg-[var(--msgbox-bg-warning)] text-[var(--msgbox-text-warning)]";
                    case "success":
                        return "bg-[var(--msgbox-bg-success)] text-[var(--msgbox-text-success)]";
                    case "secondary":
                        return "bg-[var(--msgbox-bg-secondary)] text-[var(--msgbox-text-secondary)]";
                    case "information":
                        return "bg-[var(--msgbox-bg-info)] text-[var(--msgbox-text-info)]";
                    case "default":
                    default:
                        return "bg-[var(--msgbox-bg-default)] text-[var(--msgbox-text-default)]";
                }
            };

            const getPositionClasses = () => {
                switch (position) {
                    case "bottom-right":
                        return "items-end justify-end p-6";
                    case "bottom-left":
                        return "items-end justify-start p-6";
                    case "top-right":
                        return "items-start justify-end p-6";
                    case "top-left":
                        return "items-start justify-start p-6";
                    case "center":
                    default:
                        return "items-center justify-center";
                }
            };

            return createPortal(
                <div
                    className={`
            fixed inset-0 z-50 flex ${getPositionClasses()}
            ${!blocking ? "pointer-events-none" : ""}
          `}
                >
                    {/* Backdrop */}
                    {!toast && (
                        <div
                            className={`
                absolute inset-0 bg-black/60 transition-opacity duration-200
                ${withAnimation ? (shouldAnimate && !isClosing ? "opacity-100" : "opacity-0") : ""}
              `}
                            style={{ pointerEvents: blocking ? "auto" : "none" }}
                        />
                    )}

                    {/* MessageBox panel */}
                    <div
                        className={`
              relative z-10 p-6 rounded-xl shadow-lg max-w-sm w-full space-y-4
              transform transition-all duration-300
              ${getVariantStyles()}
              ${
                  toast || !blocking
                      ? shouldAnimate && !isClosing
                          ? "translate-y-0 opacity-100"
                          : "translate-y-4 opacity-0"
                      : shouldAnimate && !isClosing
                      ? "scale-100 opacity-100"
                      : "scale-95 opacity-0"
              }
              pointer-events-auto
            `}
                    >
                        <h2 className="text-lg font-semibold">{title}</h2>
                        <p className={preserveLineBreaks ? "whitespace-pre-line" : ""}>{message}</p>

                        {/* Button */}
                        {buttonText && (
                            <div className="flex justify-end pt-4">
                                <button onClick={handleClose} className="px-4 py-2 text-sm rounded bg-white/20 hover:bg-white/30">
                                    {buttonText}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                container
            );
        };

        root.render(<MessageBoxComponent />);
    });
}
