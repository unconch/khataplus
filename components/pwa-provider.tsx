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
        let lastToastAt = 0
        let hasMounted = false

        setTimeout(() => {
            hasMounted = true
        }, 350)

        const handleOnline = () => {
            setIsOnline(true)
            if (!hasMounted) return
            if (Date.now() - lastToastAt < 2000) return
            lastToastAt = Date.now()
            toast.success("Back Online", {
                description: "Your queued updates are syncing automatically.",
                duration: 3000,
            })
        }

        const handleOffline = () => {
            setIsOnline(false)
            if (!hasMounted) return
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

    // Update Listener
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            let shown = false
            const onControllerChange = () => {
                if (shown) return
                shown = true
                toast.info("Update Available", {
                    description: "A new version is ready. Reload when convenient.",
                    action: {
                        label: "Reload",
                        onClick: () => window.location.reload()
                    },
                    duration: 12000
                })
            }

            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
            return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
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
