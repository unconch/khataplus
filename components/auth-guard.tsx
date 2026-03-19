import type React from "react"
import { redirect } from "next/navigation"

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

  const { getCurrentUser } = await import("@/lib/data/auth")
  const currentUser = await getCurrentUser()
  const userId = currentUser?.userId

  if (!userId) {
    redirect("/auth/login")
  }

  if (requireAdmin) {
    // Authz is enforced via database profile roles.
    const { getProfile } = await import("@/lib/data")
    const profile = await getProfile(userId)

    if (!profile || profile.role !== "main admin") {
      redirect("/dashboard")
    }
  }

  return <>{children}</>
}
