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

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!projectId) {
        console.error("Descope Project ID is missing.")
        return <>{children}</>
    }

    if (!mounted) return null

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
