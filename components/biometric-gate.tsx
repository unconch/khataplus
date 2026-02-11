"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Fingerprint, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BiometricGateProps {
    isRequired: boolean
    children: React.ReactNode
}

export function BiometricGate({ isRequired, children }: BiometricGateProps) {
    const [isVerified, setIsVerified] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // If not required, skip
        if (!isRequired) {
            setIsVerified(true)
            return
        }

        // Check session storage
        const hasSession = sessionStorage.getItem("biometric_verified")
        if (hasSession === "true") {
            setIsVerified(true)
        }
    }, [isRequired])

    if (!isMounted) {
      return null
    }

    const verify = async () => {
        try {
            if (!window.PublicKeyCredential) {
                alert("Biometrics not supported on this device/browser.");
                // Fallback for demo? Or block? For now, allow to proceed so they aren't locked out.
                sessionStorage.setItem("biometric_verified", "true")
                setIsVerified(true)
                return;
            }

            console.log("Requesting OS biometric prompt...");

            // This triggers the native Windows Hello / TouchID / FaceID prompt
            // We use 'create' (Registration) here because it reliably triggers the prompt without needing a pre-registered key on the server.
            // For a pure "Device Lock" check, this is sufficient to prove the user is present and authenticated to the device.
            const randomChallenge = new Uint8Array(32);
            window.crypto.getRandomValues(randomChallenge);

            await navigator.credentials.create({
                publicKey: {
                    challenge: randomChallenge,
                    rp: {
                        name: "KhataPlus",
                        id: window.location.hostname // Must match current domain
                    },
                    user: {
                        id: new Uint8Array(16),
                        name: "Staff Member",
                        displayName: "Staff Member"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform", // Forces built-in fingerprint/face scanner
                        userVerification: "required" // Forces the biometric check
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            // If we get here, the OS prompt succeeded (user scanned fingerprint/face)
            sessionStorage.setItem("biometric_verified", "true")
            setIsVerified(true)

        } catch (error) {
            console.error("Biometric failed:", error);
            // Don't verify if failed/cancelled
            alert("Verification failed. Please try again.");
        }
    }

    if (isVerified) {
        return <>{children}</>
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm border-2 border-primary/20 shadow-2xl">
                <CardContent className="flex flex-col items-center justify-center py-10 gap-6 text-center">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Fingerprint className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">Security Check</h2>
                        <p className="text-sm font-medium text-muted-foreground">
                            This account requires biometric verification.
                        </p>
                    </div>
                    <Button size="lg" className="w-full h-12 rounded-xl gap-2 font-bold" onClick={verify}>
                        <ShieldCheck className="h-4 w-4" />
                        Verify Identity
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
