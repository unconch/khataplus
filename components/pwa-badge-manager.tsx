"use client"

import { useEffect } from "react"

import { usePWA } from "@/components/pwa-provider"

type PWABadgeManagerProps = {
  isAdmin?: boolean
}

export function PWABadgeManager({ isAdmin = false }: PWABadgeManagerProps) {
  const { setBadge } = usePWA()

  useEffect(() => {
    let active = true

    const syncBadge = async () => {
      if (!isAdmin) {
        if (active) setBadge(0)
        return
      }

      try {
        const res = await fetch("/api/notifications", { cache: "no-store" })
        if (!res.ok) {
          if (active) setBadge(0)
          return
        }
        const payload = await res.json()
        const count = Array.isArray(payload?.notifications) ? payload.notifications.length : 0
        if (active) setBadge(count)
      } catch {
        if (active) setBadge(0)
      }
    }

    void syncBadge()
    const timer = window.setInterval(syncBadge, 60000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [isAdmin, setBadge])

  return null
}
