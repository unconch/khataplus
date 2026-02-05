"use client"

import { Descope } from "@descope/nextjs-sdk"
import { useUser } from "@descope/nextjs-sdk/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Logo, LogoText } from "@/components/ui/logo"

export default function LoginPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID

  useEffect(() => {
    if (user && !isUserLoading) {
      router.replace("/home")
    }
  }, [user, isUserLoading, router])

  if (!projectId || projectId === "P2uAIdoH4P2y6K6Gk6K6Gk6K6Gk6") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm p-6 border rounded-lg bg-destructive/10 text-destructive">
          <h2 className="text-lg font-semibold mb-2">Configuration Required</h2>
          <p>Please set a valid <strong>NEXT_PUBLIC_DESCOPE_PROJECT_ID</strong> in your <strong>.env.local</strong> file to enable authentication.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="flex flex-col items-center justify-center gap-4 mb-2 animate-slide-up">
          <Logo size={80} className="text-primary drop-shadow-2xl" />
          <LogoText className="text-center" />
        </div>
        <Descope
          flowId="sign-up-or-in"
          onSuccess={() => {
            router.push("/home")
            router.refresh()
          }}
          onError={(e) => console.error("Login error:", e)}
        />
      </div>
    </div>
  )
}
