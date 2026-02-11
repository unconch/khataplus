"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo, LogoText } from "@/components/ui/logo"
import { Loader2, CheckCircle, XCircle } from "lucide-react"


export default function AcceptInvitePage() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")
    const [orgName, setOrgName] = useState("")

    useEffect(() => {
        const acceptInvite = async () => {
            try {
                const res = await fetch(`/api/invite/${token}`, { method: "POST" })
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to accept invite")
                }

                setStatus("success")
                setOrgName(data.orgName)
                setMessage("You've joined the team!")

                setTimeout(() => {
                    router.push("/dashboard")
                    router.refresh()
                }, 2000)
            } catch (e: any) {
                setStatus("error")
                setMessage(e.message || "Invalid or expired invite link")
            }
        }

        if (token) {
            acceptInvite()
        }
    }, [token, router])

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center">
                        <Logo size={64} className="text-primary" />
                    </div>
                    <LogoText className="items-center" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === "loading" && (
                        <>
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground">Accepting invite...</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                            <CardTitle>Welcome to {orgName}!</CardTitle>
                            <p className="text-muted-foreground">{message}</p>
                            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="h-12 w-12 text-destructive mx-auto" />
                            <CardTitle>Invite Error</CardTitle>
                            <p className="text-muted-foreground">{message}</p>
                            <Button onClick={() => router.push("/auth/login")} className="mt-4">
                                Go to Login
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
