"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Info, Megaphone } from "lucide-react"

type AnnouncementPayload = {
    message: string
    type: "info" | "warning" | "success" | "urgent"
} | null

export function SystemAnnouncement() {
    const [announcement, setAnnouncement] = useState<AnnouncementPayload>(null)

    useEffect(() => {
        let cancelled = false

        const loadAnnouncement = async () => {
            try {
                const response = await fetch("/api/system-announcement", {
                    credentials: "same-origin",
                    cache: "force-cache",
                })
                if (!response.ok) return
                const payload = await response.json().catch(() => null)
                if (!cancelled) {
                    setAnnouncement(payload?.announcement ?? null)
                }
            } catch {
                // Non-blocking enhancement: silently skip if the fetch fails.
            }
        }

        if ("requestIdleCallback" in window) {
            const idleId = (window as Window & {
                requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number
                cancelIdleCallback?: (id: number) => void
            }).requestIdleCallback(loadAnnouncement, { timeout: 1500 })

            return () => {
                cancelled = true
                window.cancelIdleCallback?.(idleId)
            }
        }

        const timeoutId = globalThis.setTimeout(loadAnnouncement, 250)
        return () => {
            cancelled = true
            globalThis.clearTimeout(timeoutId)
        }
    }, [])

    if (!announcement?.message) return null

    const styles: Record<NonNullable<AnnouncementPayload>["type"], string> = {
        info: "bg-blue-600 text-white",
        warning: "bg-amber-500 text-white",
        success: "bg-emerald-600 text-white",
        urgent: "bg-red-600 text-white animate-pulse",
    }

    const icons: Record<NonNullable<AnnouncementPayload>["type"], ReactNode> = {
        info: <Info className="w-4 h-4" />,
        warning: <AlertCircle className="w-4 h-4" />,
        success: <CheckCircle className="w-4 h-4" />,
        urgent: <Megaphone className="w-4 h-4" />,
    }

    return (
        <div className={`relative z-[100] flex w-full items-center justify-center gap-3 px-4 py-2 text-sm font-medium shadow-md ${styles[announcement.type] || styles.info}`}>
            <span className="flex-shrink-0">
                {icons[announcement.type] || icons.info}
            </span>
            <p className="text-center">{announcement.message}</p>
        </div>
    )
}
