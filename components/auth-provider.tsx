"use client"
import { AuthProvider as DescopeAuthProvider } from "@descope/react-sdk"
import { type ReactNode, useState, useEffect } from "react"

interface AuthProviderProps {
    children: ReactNode
    projectId: string
    baseUrl?: string
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
        <DescopeAuthProvider
            projectId={projectId}
            baseUrl={baseUrl}
            sessionTokenViaCookie={{ sameSite: "Lax" }}
            refreshTokenViaCookie={{ sameSite: "Lax" }}
        >
            {children}
        </DescopeAuthProvider>
    )
}
