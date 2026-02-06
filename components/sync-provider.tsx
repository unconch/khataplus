"use client"

import { useSync } from "@/hooks/use-sync"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { ReactNode } from "react"

export function SyncProvider({ children }: { children: ReactNode }) {
    // Activates the outgoing sync (offline -> cloud)
    useSync()

    // Activates the incoming sync (cloud -> device via background refresh)
    useRealtimeSync()

    return <>{children}</>
}
