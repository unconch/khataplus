"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type DocsTheme = "dark" | "light"

type DocsNavContextValue = {
  activeAnchor: string
  setActiveAnchor: (id: string) => void
  theme: DocsTheme
  setTheme: (theme: DocsTheme) => void
  toggleTheme: () => void
}

const DocsNavContext = createContext<DocsNavContextValue | null>(null)

export function DocsNavProvider({ children }: { children: React.ReactNode }) {
  const [activeAnchor, setActiveAnchor] = useState("")
  const [theme, setThemeState] = useState<DocsTheme>("dark")

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("kp-docs-theme")
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme)
      }
    } catch {
      // Ignore localStorage read failures
    }
  }, [])

  const setTheme = (nextTheme: DocsTheme) => {
    setThemeState(nextTheme)
    try {
      window.localStorage.setItem("kp-docs-theme", nextTheme)
    } catch {
      // Ignore localStorage write failures
    }
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  const value = useMemo(
    () => ({ activeAnchor, setActiveAnchor, theme, setTheme, toggleTheme }),
    [activeAnchor, theme]
  )

  return <DocsNavContext.Provider value={value}>{children}</DocsNavContext.Provider>
}

export function useDocsNav() {
  const ctx = useContext(DocsNavContext)
  if (!ctx) {
    return {
      activeAnchor: "",
      setActiveAnchor: () => {},
      theme: "dark" as DocsTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    }
  }
  return ctx
}
