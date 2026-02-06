"use client"

import { useRealtimeSync } from "@/hooks/use-realtime-sync"

interface RealtimeSyncActivatorProps {
    orgId: string
}

/**
 * This component's sole purpose is to mount the useRealtimeSync hook
 * with the provided orgId. Placing it here allows us to activate
 * sync once the organization context is resolved.
 */
export function RealtimeSyncActivator({ orgId }: RealtimeSyncActivatorProps) {
    useRealtimeSync(orgId)
    return null
}
