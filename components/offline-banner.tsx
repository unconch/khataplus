"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { WifiOff, RotateCw } from "lucide-react"

export function OfflineBanner() {
    const isOnline = useOnlineStatus()

    if (isOnline) return null

    return (
        <div
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
            <div className="bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
                <div className="bg-red-500/10 p-2 rounded-full">
                    <WifiOff size={18} className="text-red-500" />
                </div>
                <div>
                    <p className="text-sm font-medium">You are offline</p>
                    <p className="text-xs text-zinc-400">Available mostly in read-only mode.</p>
                </div>
                <div className="ml-4 pl-4 border-l border-zinc-700">
                    <RotateCw size={16} className="text-zinc-500 animate-spin" />
                </div>
            </div>
        </div>
    )
}
