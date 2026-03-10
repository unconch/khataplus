"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type MotionPreference = "auto" | "on" | "off"

interface MotionContextValue {
  enableMotion: boolean
  preference: MotionPreference
  setPreference: (pref: MotionPreference) => void
  reason: string
}

const MotionContext = createContext<MotionContextValue | null>(null)

const STORAGE_KEY = "motion-preference"

const getStoredPreference = (): MotionPreference => {
  if (typeof window === "undefined") return "auto"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "on" || stored === "off" || stored === "auto") return stored
  return "auto"
}

const savePreference = (pref: MotionPreference) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, pref)
}

const computeAutoMotion = () => {
  if (typeof window === "undefined") return { enableMotion: true, reason: "ssr" }
  // Disable animations on mobile devices (viewport width < 768px)
  const isMobile = window.innerWidth < 768
  if (isMobile) return { enableMotion: false, reason: "mobile-device" }
  const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  if (prefersReduce) return { enableMotion: false, reason: "prefers-reduced-motion" }

  const connection = (navigator as any).connection
  const saveData = connection?.saveData ?? false
  if (saveData) return { enableMotion: false, reason: "save-data" }

  const effectiveType = connection?.effectiveType as string | undefined
  if (effectiveType && (effectiveType === "slow-2g" || effectiveType === "2g")) {
    return { enableMotion: false, reason: "slow-connection" }
  }

  const cores = navigator.hardwareConcurrency ?? 2
  const mem = (navigator as any).deviceMemory ?? 2

  if (cores < 4) return { enableMotion: false, reason: "low-cpu" }
  if (mem < 4) return { enableMotion: false, reason: "low-memory" }

  return { enableMotion: true, reason: "auto" }
}

const applyHtmlClass = (enable: boolean) => {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.toggle("rich-motion", enable)
  root.classList.toggle("static-motion", !enable)
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<MotionPreference>("auto")
  // Initialize with actual capability detection instead of generic SSR state
  const [autoState, setAutoState] = useState(() => computeAutoMotion())

  useEffect(() => {
    setPreference(getStoredPreference())
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        setAutoState(computeAutoMotion())
      }
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "on" || e.newValue === "off" || e.newValue === "auto")) {
        setPreference(e.newValue as MotionPreference)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility, { passive: true })
    window.addEventListener("storage", handleStorage)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const { enableMotion, reason } = useMemo(() => {
    if (preference === "on") return { enableMotion: true, reason: "forced-on" }
    if (preference === "off") return { enableMotion: false, reason: "forced-off" }
    return autoState
  }, [preference, autoState])

  useEffect(() => {
    applyHtmlClass(enableMotion)
  }, [enableMotion])

  const value: MotionContextValue = useMemo(() => ({
    enableMotion,
    preference,
    reason,
    setPreference: (pref) => {
      setPreference(pref)
      savePreference(pref)
    },
  }), [enableMotion, preference, reason])

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export const useMotion = () => {
  const ctx = useContext(MotionContext)
  if (!ctx) {
    return {
      enableMotion: true,
      preference: "auto" as MotionPreference,
      reason: "ssr-fallback",
      setPreference: () => { },
    }
  }
  return ctx
}
