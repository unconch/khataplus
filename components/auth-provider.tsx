"use client"
import { type ReactNode, useState, useEffect } from "react"
import { AuthProvider as DescopeProvider } from "@descope/nextjs-sdk"

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="min-h-screen bg-zinc-950" />
    }

    return (
        <DescopeProvider projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID || ""}>
            {children}
        </DescopeProvider>
    )
}
