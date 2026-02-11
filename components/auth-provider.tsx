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
}

export function AuthProvider({ children, projectId }: AuthProviderProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])


    if (!projectId) {
        console.error("Descope Project ID is missing. AuthProvider will not function correctly.")
        return <>{children}</>
    }

    // Prevent SSR issues with the SDK
    // if (!mounted) {
    //     return <div style={{ visibility: 'hidden' }}>{children}</div>
    // }

    if (!mounted) {
        return null
    }

    return (
        <ErrorBoundary fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6 text-center space-y-4">
                <div className="text-destructive font-bold text-xl">Authentication Service Blocked</div>
                <p className="text-muted-foreground max-w-sm">
                    It looks like your browser (Brave, or one with rigid privacy settings) is blocking the authentication service.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg text-xs font-mono text-left w-full max-w-md overflow-auto">
                    Potential Solution: Disable "Brave Shields" for this site or allow 3rd-party cookies.
                </div>
                {/* Fallback to children for non-auth functionality if possible (descope might be needed though) */}
                {/* For now, just show children but Auth won't work? No, context is missing. Just show error. */}
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
                sessionTokenViaCookie={{ sameSite: "Lax" }}
                refreshTokenViaCookie={{ sameSite: "Lax" }}
            >
                {children}
            </DescopeAuthProvider>
        </ErrorBoundary>
    )
}
