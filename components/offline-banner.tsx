"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { WifiOff, CloudOff } from "lucide-react"

export function OfflineBanner() {
    const isOnline = useOnlineStatus()

    if (isOnline) return null

    return (
        <div
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
            <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-500/15 p-2 rounded-full border border-amber-200 dark:border-amber-500/20">
                    <WifiOff size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold">Working offline</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">You can keep billing. Changes will sync automatically.</p>
                </div>
                <div className="ml-3 pl-3 border-l border-zinc-200 dark:border-zinc-700">
                    <CloudOff size={16} className="text-zinc-500" />
                </div>
            </div>
        </div>
    )
}
