"use client"

import { useState, useEffect, createContext, useContext } from "react"

type PerformanceTier = "low" | "high"

interface PerformanceContextType {
    tier: PerformanceTier
    isLowEnd: boolean
}

const PerformanceContext = createContext<PerformanceContextType>({
    tier: "high",
    isLowEnd: false,
})

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
    const [tier, setTier] = useState<PerformanceTier>("high")

    useEffect(() => {
        const checkPerformance = () => {
            // 1. Check for reduced motion preference (User Level)
            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            if (prefersReducedMotion) {
                setTier("low")
                return
            }

            // 2. Hardware Capabilities Check
            const cores = navigator.hardwareConcurrency || 4
            // @ts-ignore - deviceMemory is Chromium only
            const memory = navigator.deviceMemory || 4

            // Heuristic for low-end device: < 4 cores OR < 4GB RAM
            // This captures older phones and budget laptops
            if (cores < 4 || memory < 4) {
                setTier("low")
            } else {
                setTier("high")
            }
        }

        checkPerformance()
    }, [])

    return (
        <PerformanceContext.Provider value={{ tier, isLowEnd: tier === "low" }}>
            {children}
        </PerformanceContext.Provider>
    )
}

export const usePerformance = () => useContext(PerformanceContext)
