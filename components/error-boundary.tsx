"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-bold">Something went wrong</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            this.setState({ hasError: false, error: null })
                            window.location.reload()
                        }}
                    >
                        Reload Page
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
