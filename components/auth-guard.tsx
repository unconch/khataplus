import type React from "react"
import { redirect } from "next/navigation"
import { session } from "@descope/nextjs-sdk/server"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export async function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const currSession = await session()

  if (!currSession) {
    redirect("/auth/login")
  }

  if (requireAdmin) {
    // Descope roles can be in different properties depending on the version/config
    const roles = (currSession as any).token?.roles ||
      (currSession as any).sessionToken?.roles ||
      (currSession as any).user?.roleNames || []

    if (!roles.includes("main admin")) {
      redirect("/home")
    }
  }

  return <>{children}</>
}
