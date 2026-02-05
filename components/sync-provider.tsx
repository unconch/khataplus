"use client"

import { useSync } from "@/hooks/use-sync"
import { ReactNode } from "react"

export function SyncProvider({ children }: { children: ReactNode }) {
    // Just mounting this hook activates the auto-sync listener
    useSync()

    return <>{children}</>
}
