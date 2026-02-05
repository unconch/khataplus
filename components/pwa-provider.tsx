"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

interface PWAContextType {
    isOnline: boolean
    isStandalone: boolean
    badgeCount: number
    setBadge: (count: number) => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true)
    const [isStandalone, setIsStandalone] = useState(false)
    const [badgeCount, setBadgeCount] = useState(0)

    useEffect(() => {
        // Initial state
        setIsOnline(navigator.onLine)
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

        const handleOnline = () => {
            setIsOnline(true)
            toast.success("Back Online", {
                description: "Synchronizing data with the secure ledger...",
                duration: 4000,
            })
        }

        const handleOffline = () => {
            setIsOnline(false)
            toast.warning("Sailing Offline", {
                description: "Transactions will be queued for background sync.",
                duration: 6000,
            })
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    // Update Listener
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Reload when new SW takes control (skipWaiting: true in config makes this happen immediately)
            // But we might want to just toast.
            // With skipWaiting: true, the new SW activates instantly.
            // We should notify user to refresh.

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // This fires when the standard SW is replaced by a new one
                toast.info("Update Available", {
                    description: "A new version of the app is ready.",
                    action: {
                        label: "Reload",
                        onClick: () => window.location.reload()
                    },
                    duration: Infinity // Stay until clicked
                })
            })
        }
    }, [])

    // Badging API Synchronization
    useEffect(() => {
        if ('setAppBadge' in navigator && badgeCount >= 0) {
            if (badgeCount === 0) {
                (navigator as any).clearAppBadge().catch(console.error)
            } else {
                (navigator as any).setAppBadge(badgeCount).catch(console.error)
            }
        }
    }, [badgeCount])

    return (
        <PWAContext.Provider value={{ isOnline, isStandalone, badgeCount, setBadge: setBadgeCount }}>
            {children}
        </PWAContext.Provider>
    )
}

export const usePWA = () => {
    const context = useContext(PWAContext)
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider")
    }
    return context
}
