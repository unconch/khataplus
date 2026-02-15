"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Fingerprint, Lock, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { toast } from "sonner"

interface BiometricGateProps {
    isRequired: boolean
    children: React.ReactNode
}

export function BiometricGate({ isRequired, children }: BiometricGateProps) {
    const [isVerified, setIsVerified] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [needsRegistration, setNeedsRegistration] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        if (!isRequired) {
            setIsVerified(true)
            return
        }
    }, [isRequired])

    if (!isMounted) return null

    const handleRegistration = async () => {
        setIsLoading(true)
        try {
            const resp = await fetch('/api/auth/webauthn/register/options')
            if (!resp.ok) throw new Error('Failed to get registration options')

            const options = await resp.json()
            const regResp = await startRegistration({ optionsJSON: options })

            const verifyResp = await fetch('/api/auth/webauthn/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regResp),
            })

            if (verifyResp.ok) {
                toast.success("Device Registered Successfully")
                setNeedsRegistration(false)
                await handleAuthentication()
            } else {
                throw new Error('Registration verification failed')
            }
        } catch (error: any) {
            console.error("Registration failed:", error)
            toast.error(error.message || "Registration failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAuthentication = async () => {
        setIsLoading(true)
        try {
            const resp = await fetch('/api/auth/webauthn/authenticate/options')
            if (!resp.ok) {
                const data = await resp.json()
                if (data.error === 'Credential not found' || data.error === 'No credentials found') {
                    setNeedsRegistration(true)
                    return
                }
                throw new Error(data.error || 'Failed to get authentication options')
            }

            const options = await resp.json()
            if (!options.allowCredentials || options.allowCredentials.length === 0) {
                setNeedsRegistration(true)
                return
            }

            const authResp = await startAuthentication({ optionsJSON: options })

            const verifyResp = await fetch('/api/auth/webauthn/authenticate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authResp),
            })

            if (verifyResp.ok) {
                setIsVerified(true)
                toast.success("Identity Verified")
            } else {
                throw new Error('Authentication failed')
            }
        } catch (error: any) {
            console.error("Biometric failed:", error)
            if (error.name === 'NotAllowedError') {
                toast.error("Verification cancelled")
            } else {
                toast.error(error.message || "Biometric check failed")
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (isVerified) return <>{children}</>

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm border-2 border-primary/20 shadow-2xl">
                <CardContent className="flex flex-col items-center justify-center py-10 gap-6 text-center">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Fingerprint className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">
                            {needsRegistration ? "Setup Biometrics" : "Security Check"}
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground">
                            {needsRegistration
                                ? "Protect your account with your device's biometric security."
                                : "This account requires cryptographic verification."}
                        </p>
                    </div>

                    {needsRegistration ? (
                        <Button size="lg" className="w-full h-12 rounded-xl gap-2 font-bold" onClick={handleRegistration} disabled={isLoading}>
                            <PlusCircle className="h-4 w-4" />
                            {isLoading ? "Enrolling..." : "Enroll Device"}
                        </Button>
                    ) : (
                        <Button size="lg" className="w-full h-12 rounded-xl gap-2 font-bold" onClick={handleAuthentication} disabled={isLoading}>
                            <ShieldCheck className="h-4 w-4" />
                            {isLoading ? "Verifying..." : "Verify Identity"}
                        </Button>
                    )}

                    {!needsRegistration && (
                        <button
                            className="text-xs text-muted-foreground hover:underline"
                            onClick={() => setNeedsRegistration(true)}
                        >
                            Need to enroll a new device?
                        </button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
