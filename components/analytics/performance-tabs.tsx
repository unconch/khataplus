"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function PerformanceTabs({ active }: { active: 'analytics' | 'reports' }) {
    return (
        <div className="flex items-center gap-8 border-b border-zinc-100 dark:border-white/10 mb-4">
            <Link
                href="/dashboard/analytics"
                className={cn(
                    "pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                    active === 'analytics'
                        ? "text-zinc-950 dark:text-zinc-100"
                        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                )}
            >
                Analytics
                {active === 'analytics' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d97706] animate-in fade-in slide-in-from-bottom-1 duration-300" />
                )}
            </Link>
            <Link
                href="/dashboard/reports"
                className={cn(
                    "pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                    active === 'reports'
                        ? "text-zinc-950 dark:text-zinc-100"
                        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                )}
            >
                Reports
                {active === 'reports' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] animate-in fade-in slide-in-from-bottom-1 duration-300" />
                )}
            </Link>
        </div>
    )
}
