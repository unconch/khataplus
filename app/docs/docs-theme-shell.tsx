"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocsNav } from "./docs-nav-provider"

export function DocsThemeShell({ children }: { children: React.ReactNode }) {
    const { theme, toggleTheme } = useDocsNav()
    const isLight = theme === "light"

    return (
        <div
            className={cn(
                "min-h-screen transition-colors duration-300",
                isLight
                    ? "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.07),transparent_28%),linear-gradient(180deg,#f6fbf8_0%,#eff6ff_40%,#eef4ff_100%)] text-zinc-900"
                    : "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.07),transparent_28%),linear-gradient(180deg,#18181b_0%,#111113_36%,#0d0d10_100%)] text-zinc-300"
            )}
        >
            <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                    "fixed right-6 top-24 z-[70] inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-black uppercase tracking-[0.14em] shadow-[0_14px_32px_-24px_rgba(0,0,0,0.55)] backdrop-blur-sm transition-colors",
                    isLight
                        ? "border-zinc-200 bg-white/90 text-zinc-700 hover:text-zinc-950"
                        : "border-zinc-800 bg-zinc-950/85 text-zinc-300 hover:text-white"
                )}
                aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            >
                {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                {isLight ? "Black Mode" : "White Mode"}
            </button>
            {children}
        </div>
    )
}
