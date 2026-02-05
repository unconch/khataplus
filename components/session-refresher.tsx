"use client"

import { useDescope, useSession } from "@descope/nextjs-sdk/client"
import { useEffect } from "react"

export function SessionRefresher() {
    const { refresh } = useDescope()
    const { isSessionLoading } = useSession()

    useEffect(() => {
        // Only attempt refresh if not loading
        if (!isSessionLoading) {
            refresh()
        }
    }, [refresh, isSessionLoading])

    return null
}
