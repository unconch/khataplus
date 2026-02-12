"use client"

import dynamic from "next/dynamic"
import { type ReactNode, useState, useEffect } from "react"
import { ErrorBoundary } from "./error-boundary"

const DescopeAuthProvider = dynamic(
    () => import('@descope/react-sdk').then(mod => mod.AuthProvider),
    { ssr: false }
)

interface AuthProviderProps {
    children: ReactNode;
    projectId: string;
    baseUrl?: string;
}

export function AuthProvider({ children, projectId, baseUrl }: AuthProviderProps) {
    const [mounted, setMounted] = useState(false)
    const [authBlocked, setAuthBlocked] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Check if our proxy is reachable (not api.descope.com directly)
        const checkProxy = async () => {
            try {
                const proxyUrl = baseUrl ? `${baseUrl}/v1/health` : "https://api.descope.com/v1/health"
                const res = await fetch(proxyUrl, { method: "GET", signal: AbortSignal.timeout(5000) })
                // Any response (even 404) means the proxy is reachable
                if (!res) setAuthBlocked(true)
            } catch {
                // Only block if it's truly unreachable
                if (baseUrl) {
                    // Proxy exists but failed — don't block, let SDK try
                    setAuthBlocked(false)
                } else {
                    setAuthBlocked(true)
                }
            }
        }

        checkProxy()
    }, [baseUrl])

    if (!projectId) {
        console.error("Descope Project ID is missing.")
        return <>{children}</>
    }

    if (!mounted) return null

    // Only show blocked screen if no proxy is configured AND auth is blocked
    if (authBlocked && !baseUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6 text-center space-y-4">
                <div className="text-destructive font-bold text-xl">Authentication Service Blocked</div>
                <p className="text-muted-foreground max-w-sm">
                    It looks like your browser is blocking the authentication service.
                    This is often caused by 3rd-party cookie blocking or tracker prevention.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg text-xs font-mono text-left w-full max-w-md overflow-auto border border-border/50">
                    <p className="font-bold mb-2 text-foreground">Recommended Fixes:</p>
                    <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Disable "Brave Shields" for this site</li>
                        <li>Allow 3rd-party cookies in browser settings</li>
                        <li>Try a different browser (Chrome/Edge/Safari)</li>
                    </ul>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                    Reload Page
                </button>
            </div>
        )
    }

    return (
        <ErrorBoundary fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6 text-center space-y-4">
                <div className="text-destructive font-bold text-xl">Authentication Unavailable</div>
                <p className="text-muted-foreground max-w-sm">
                    Something went wrong loading the authentication service. Please try reloading.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                    Reload Page
                </button>
            </div>
        }>
            <DescopeAuthProvider
                projectId={projectId}
                baseUrl={baseUrl}
                sessionTokenViaCookie={{ sameSite: "Lax" }}
                refreshTokenViaCookie={{ sameSite: "Lax" }}
            >
                {children}
            </DescopeAuthProvider>
        </ErrorBoundary>
    )
}
