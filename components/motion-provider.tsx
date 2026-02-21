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
  const [autoState, setAutoState] = useState(() => computeAutoMotion())

  useEffect(() => {
    setPreference(getStoredPreference())
    setAutoState(computeAutoMotion())
  }, [])

  useEffect(() => {
    const recheck = () => setAutoState(computeAutoMotion())
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "on" || e.newValue === "off" || e.newValue === "auto")) {
        setPreference(e.newValue)
      }
    }

    window.addEventListener("resize", recheck, { passive: true })
    document.addEventListener("visibilitychange", recheck, { passive: true })
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("resize", recheck)
      document.removeEventListener("visibilitychange", recheck)
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

  const value: MotionContextValue = {
    enableMotion,
    preference,
    reason,
    setPreference: (pref) => {
      setPreference(pref)
      savePreference(pref)
    },
  }

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export const useMotion = () => {
  const ctx = useContext(MotionContext)
  if (!ctx) throw new Error("useMotion must be used within MotionProvider")
  return ctx
}
