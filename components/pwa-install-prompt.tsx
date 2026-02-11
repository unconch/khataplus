"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const { trigger } = useHaptic()

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt after a small delay to not annoy immediately
            setTimeout(() => setIsVisible(true), 3000)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        trigger("light")
        if (!deferredPrompt) {
          return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setIsVisible(false)
        }
        setDeferredPrompt(null)
    }

    if (!isVisible) {
      return null
    }

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-2xl p-4 pr-12 relative flex items-center gap-4 max-w-sm border border-zinc-800 dark:border-zinc-200">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                    <Download className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Install App</h4>
                    <p className="text-xs opacity-80">Add to Home Screen for offline access.</p>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    className="ml-auto font-bold text-xs h-8"
                    onClick={handleInstall}
                >
                    Install
                </Button>
                <button
                    className="absolute top-2 right-2 text-white/50 dark:text-zinc-900/50 hover:text-white dark:hover:text-zinc-900"
                    onClick={() => setIsVisible(false)}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
