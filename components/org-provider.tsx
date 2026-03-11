"use client"

import { createContext, useContext } from "react"

type OrgContextType = {
  orgId: string
  slug: string
}

const OrgContext = createContext<OrgContextType | null>(null)

export function OrgProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: OrgContextType
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)

  if (!ctx) {
    throw new Error("useOrg must be used inside OrgProvider")
  }

  return ctx
}
