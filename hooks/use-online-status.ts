"use client"

import { useState, useEffect } from "react"

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

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    return isOnline
}
