"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * useRealtimeSync: Spec-Compliant SSE + Polling Fallback
 * 
 * 7. Client Sync Flow
 * - Connects to /api/sync/stream
 * - Listens for 'sync_required' events
 * - Falls back to smart polling if SSE is unavailable
 */
export function useRealtimeSync(orgId?: string) {
    const router = useRouter()
    const lastSyncRef = useRef<number>(Date.now())
    const hiddenAtRef = useRef<number | null>(null)

    const pullSync = useCallback(() => {
        // Spec 7: Actual data sync happens via router.refresh().
        // Throttle to keep resume/focus transitions from feeling heavy.
        if (Date.now() - lastSyncRef.current < 5000) {
            return
        }

        router.refresh()
        lastSyncRef.current = Date.now()
    }, [router])

    useEffect(() => {
        if (!orgId) {
            return
        }

        let eventSource: EventSource | null = null
        let pollingInterval: NodeJS.Timeout | null = null
        const resumeSyncThresholdMs = 45_000

        const setupSSE = () => {
            if (!navigator.onLine) {
                startPolling()
                return
            }
            eventSource = new EventSource(`/api/sync/stream?orgId=${orgId}`)

            // 5.1 sync_required
            eventSource.addEventListener("sync_required", () => {
                pullSync()
            })

            // 5.2 force_resync
            eventSource.addEventListener("force_resync", () => {
                window.location.reload() // Full resync as per spec
            })

            eventSource.onerror = () => {
                if (eventSource) {
                    eventSource.close()
                    eventSource = null
                }
                startPolling()
            }
        }

        const startPolling = () => {
            if (!navigator.onLine) {
                return
            }
            if (pollingInterval) {
                return
            }

            // 8. Fallback Strategy: Smart Polling (30s as per spec fallback)
            pollingInterval = setInterval(() => {
                const pageIsVisible = document.visibilityState === "visible"
                if (pageIsVisible && Date.now() - lastSyncRef.current > 25000) {
                    pullSync()
                }
            }, 30000)
        }

        const stopPolling = () => {
            if (pollingInterval) {
                clearInterval(pollingInterval)
                pollingInterval = null
            }
        }

        // Initialize connection
        setupSSE()

        const handleOnline = () => {
            stopPolling()
            if (!eventSource) setupSSE()
            if (Date.now() - lastSyncRef.current > 15_000) {
                pullSync()
            }
        }
        const handleOffline = () => {
            if (eventSource) {
                eventSource.close()
                eventSource = null
            }
            stopPolling()
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                hiddenAtRef.current = Date.now()
                return
            }

            const hiddenAt = hiddenAtRef.current
            hiddenAtRef.current = null

            if (!navigator.onLine || !hiddenAt) {
                return
            }

            if (Date.now() - hiddenAt >= resumeSyncThresholdMs) {
                pullSync()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            if (eventSource) {
                eventSource.close()
            }
            stopPolling()
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [orgId, pullSync])
}
