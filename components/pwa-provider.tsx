"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PWAContextType {
  isOnline: boolean
  isStandalone: boolean
  badgeCount: number
  setBadge: (count: number) => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

const notify = async (
  method: "success" | "warning" | "info",
  title: string,
  options?: Record<string, unknown>
) => {
  const { toast } = await import("sonner")
  ;(toast[method] as (message: string, opts?: Record<string, unknown>) => void)(title, options)
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine))
  const [isStandalone, setIsStandalone] = useState(
    () => (typeof window === "undefined" ? false : window.matchMedia("(display-mode: standalone)").matches)
  )
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void notify("success", "Back online", {
        description: "Synchronizing data with the secure ledger...",
        duration: 4000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      void notify("warning", "Sailing offline", {
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

  useEffect(() => {
    if ("setAppBadge" in navigator && badgeCount >= 0) {
      const badgeApi = navigator as any
      if (badgeCount === 0) {
        badgeApi.clearAppBadge?.().catch?.(console.error)
      } else {
        badgeApi.setAppBadge?.(badgeCount).catch?.(console.error)
      }
    }
  }, [badgeCount])

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const register = () => {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        void notify("info", "Update available", {
          description: "A new version of the app is ready.",
          action: {
            label: "Reload",
            onClick: () => window.location.reload(),
          },
          duration: Infinity,
        })
      })
    }

    if ("requestIdleCallback" in window) {
      ;(window as Window & { requestIdleCallback: (callback: () => void) => number }).requestIdleCallback(register)
      return
    }

    const timeoutId = globalThis.setTimeout(register, 0)
    return () => globalThis.clearTimeout(timeoutId)
  }, [])

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
