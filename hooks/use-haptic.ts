"use client"

import { useCallback } from "react"

type HapticType = "light" | "medium" | "heavy" | "success" | "error" | "warning"

export function useHaptic() {
    const trigger = useCallback((type: HapticType = "light") => {
        if (typeof window === "undefined" || !navigator.vibrate) return

        switch (type) {
            case "light":
                navigator.vibrate(10) // Crisp tap
                break
            case "medium":
                navigator.vibrate(40) // Firm tap
                break
            case "heavy":
                navigator.vibrate(80) // Heavy thud
                break
            case "success":
                navigator.vibrate([30, 50, 30]) // Double tap
                break
            case "warning":
                navigator.vibrate([30, 50])
                break
            case "error":
                navigator.vibrate([50, 30, 50, 30, 50]) // Buzz
                break
        }
    }, [])

    return { trigger }
}
