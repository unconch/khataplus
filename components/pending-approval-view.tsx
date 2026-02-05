"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClockIcon, XCircleIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface PendingApprovalViewProps {
  email: string
  isDisabled: boolean
}

import { useDescope } from "@descope/nextjs-sdk/client"

export function PendingApprovalView({ email, isDisabled }: PendingApprovalViewProps) {
  const router = useRouter()
  const { logout } = useDescope()

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-border/50 text-center">
          <CardHeader>
            <div
              className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-2 ${isDisabled ? "bg-destructive/10" : "bg-amber-500/10"
                }`}
            >
              {isDisabled ? (
                <XCircleIcon className="w-7 h-7 text-destructive" />
              ) : (
                <ClockIcon className="w-7 h-7 text-amber-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-semibold">
              {isDisabled ? "Account Disabled" : "Account Under Review"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isDisabled
                ? "Your account has been disabled. Please contact an administrator for assistance."
                : "Your access request is pending admin verification. You'll be able to access the app once approved."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Signed in as {email}</p>
            <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
