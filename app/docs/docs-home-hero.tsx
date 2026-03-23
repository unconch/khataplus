"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocsNav } from "./docs-nav-provider"

const featuredLinks = [
    { label: "Quick setup", href: "/docs/quick-start-5-minute-guide" },
    { label: "First invoice", href: "/docs/create-first-invoice" },
    { label: "GST check", href: "/docs/fix-gst-mismatch" },
]

export function DocsHomeHero() {
    const { theme } = useDocsNav()
    const isLight = theme === "light"

    return (
        <div
            className={cn(
                "mb-12 border-b pb-10",
                isLight ? "border-zinc-200/90" : "border-zinc-800/90"
            )}
        >
            <div className="max-w-4xl">
                <h1 className={cn("text-3xl font-bold tracking-tight md:text-[44px]", isLight ? "text-zinc-950" : "text-white")}>
                    KhataPlus docs that feel like a product walkthrough.
                </h1>
                <p className={cn("mt-4 max-w-3xl text-base leading-relaxed md:text-lg", isLight ? "text-zinc-600" : "text-zinc-400")}>
                    Open the right page, click the right button, and follow the same flows your team uses in the app every day.
                </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                    href="/docs/quick-start-5-minute-guide"
                    className={cn(
                        "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all",
                        isLight ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-zinc-950 hover:bg-zinc-200"
                    )}
                >
                    Start with quick setup
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/docs/create-first-invoice"
                    className={cn(
                        "inline-flex items-center gap-2 text-sm font-semibold transition-colors",
                        isLight ? "text-zinc-700 hover:text-zinc-950" : "text-zinc-300 hover:text-white"
                    )}
                >
                    See billing flow
                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {featuredLinks.map((item, index) => (
                    <div key={item.label} className="flex items-center gap-3">
                        {index > 0 && <span className={cn("hidden h-1 w-1 rounded-full sm:inline-block", isLight ? "bg-zinc-300" : "bg-zinc-700")} />}
                        <Link
                            href={item.href}
                            className={cn(
                                "text-sm font-semibold transition-colors",
                                isLight ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            {item.label}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}
