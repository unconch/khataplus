"use client"

import { useEffect, useState } from "react"

export function useIsPWA() {
    const [isPWA, setIsPWA] = useState(false)

    useEffect(() => {
        // Check if running in standalone mode (PWA installed)
        const checkPWA = () => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                (window.navigator as any).standalone === true
            setIsPWA(isStandalone)
        }

        checkPWA()

        // Listen for changes (unlikely to change in session, but good practice)
        const matcher = window.matchMedia("(display-mode: standalone)")
        matcher.addEventListener("change", checkPWA)
        return () => matcher.removeEventListener("change", checkPWA)
    }, [])

    return isPWA
}
