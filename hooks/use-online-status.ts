"use client"

import { useState, useEffect } from "react"

import { toast } from "sonner"

/**
 * Hook to track the user's online/offline status.
 * Returns true if online, false if offline.
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // Initial check
        if (typeof window !== "undefined") {
            setIsOnline(window.navigator.onLine)
        }

        let lastToastAt = 0
        const handleOnline = () => {
            setIsOnline(true)
            if (Date.now() - lastToastAt < 2000) return
            lastToastAt = Date.now()
            toast.success("Back Online", {
                description: "Your queued updates are syncing automatically.",
                duration: 3000,
            })
        }
        const handleOffline = () => {
            setIsOnline(false)
            if (Date.now() - lastToastAt < 2000) return
            lastToastAt = Date.now()
            toast.warning("Offline Mode", {
                description: "You can continue working. Changes will sync once connected.",
                duration: 4500,
            })
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    return isOnline
}
