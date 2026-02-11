"use client"

import { useEffect, useCallback } from "react"
import { usePWA } from "@/components/pwa-provider"
import { getPendingApprovalsCount } from "@/lib/data/profiles"

export function PWABadgeManager({ isAdmin }: { isAdmin: boolean }) {
    const { setBadge } = usePWA()

    const updateBadge = useCallback(async () => {
        if (!isAdmin) {
            setBadge(0)
            return
        }

        try {
            const count = await getPendingApprovalsCount()
            setBadge(count)
        } catch (error) {
            console.error("Failed to sync app badge:", error)
        }
    }, [isAdmin, setBadge])

    useEffect(() => {
        updateBadge()

        // Refresh badge every 5 minutes while app is open
        const interval = setInterval(updateBadge, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [updateBadge])

    return null
}
