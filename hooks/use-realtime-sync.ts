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

    const pullSync = useCallback(() => {
        // Spec 7: Actual data sync happens via normal router.refresh() 
        // which triggers server component revalidation
        console.log("[Sync] Triggering pullSync (refresh)...")
        router.refresh()
        lastSyncRef.current = Date.now()
    }, [router])

    useEffect(() => {
        if (!orgId) return

        let eventSource: EventSource | null = null
        let pollingInterval: NodeJS.Timeout | null = null

        const setupSSE = () => {
            console.log("[Sync] Connecting to SSE stream...")
            eventSource = new EventSource(`/api/sync/stream?orgId=${orgId}`)

            // 5.1 sync_required
            eventSource.addEventListener("sync_required", (event) => {
                const payload = JSON.parse(event.data)
                console.log("[Sync] sync_required received for:", payload.entity)
                pullSync()
            })

            // 5.2 force_resync
            eventSource.addEventListener("force_resync", () => {
                console.log("[Sync] force_resync received")
                window.location.reload() // Full resync as per spec
            })

            eventSource.onerror = () => {
                console.warn("[Sync] SSE Connection failed. Falling back to polling.")
                if (eventSource) {
                    eventSource.close()
                    eventSource = null
                }
                startPolling()
            }
        }

        const startPolling = () => {
            if (pollingInterval) return

            // 8. Fallback Strategy: Smart Polling (30s as per spec fallback)
            console.log("[Sync] Starting fallback polling (30s)")
            pollingInterval = setInterval(() => {
                // Only poll if tab is active and we haven't synced very recently
                if (document.hasFocus() && Date.now() - lastSyncRef.current > 25000) {
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

        // also refresh on window focus as per spec 8
        const handleFocus = () => {
            console.log("[Sync] Window focused, immediate sync")
            pullSync()
        }
        window.addEventListener("focus", handleFocus)

        return () => {
            if (eventSource) eventSource.close()
            stopPolling()
            window.removeEventListener("focus", handleFocus)
        }
    }, [orgId, pullSync])
}
