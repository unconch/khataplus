"use client"

import { createContext, useContext, useMemo, useState } from "react"

type DocsNavContextValue = {
  activeAnchor: string
  setActiveAnchor: (id: string) => void
}

const DocsNavContext = createContext<DocsNavContextValue | null>(null)

export function DocsNavProvider({ children }: { children: React.ReactNode }) {
  const [activeAnchor, setActiveAnchor] = useState("")
  const value = useMemo(() => ({ activeAnchor, setActiveAnchor }), [activeAnchor])
  return <DocsNavContext.Provider value={value}>{children}</DocsNavContext.Provider>
}

export function useDocsNav() {
  const ctx = useContext(DocsNavContext)
  if (!ctx) {
    return { activeAnchor: "", setActiveAnchor: () => {} }
  }
  return ctx
}
