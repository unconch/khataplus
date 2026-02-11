import type React from "react"
import { redirect } from "next/navigation"
import { session } from "@descope/nextjs-sdk/server"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export async function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isGuestMode } = await import("@/lib/data")
  const isGuest = await isGuestMode()

  if (isGuest) {
    return <>{children}</>
  }

  const sessionRes = await session()
  const userId = sessionRes?.token?.sub

  if (!userId) {
    redirect("/auth/login")
  }

  if (requireAdmin) {
    // For Descope, we check roles from the database profile
    const { getProfile } = await import("@/lib/data")
    const profile = await getProfile(userId)

    if (!profile || profile.role !== "main admin") {
      redirect("/dashboard")
    }
  }

  return <>{children}</>
}
