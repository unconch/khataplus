"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useHaptic } from "@/hooks/use-haptic"

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const { trigger } = useHaptic()

    useEffect(() => {
        const DISMISS_KEY = "kp_pwa_prompt_dismissed_until"
        const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || "0")
        if (dismissedUntil > Date.now()) return

        const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        if (isStandalone) return

        const ua = navigator.userAgent.toLowerCase()
        const ios = /iphone|ipad|ipod/.test(ua)
        setIsIOS(ios)

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setTimeout(() => setIsVisible(true), 12000)
        }

        window.addEventListener("beforeinstallprompt", handler)

        if (ios) {
            setTimeout(() => setIsVisible(true), 15000)
        }

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem("kp_pwa_prompt_dismissed_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000))
    }

    const handleInstall = async () => {
        trigger("medium")
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setIsVisible(false)
            localStorage.setItem("kp_pwa_prompt_dismissed_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000))
        }
        setDeferredPrompt(null)
    }

    if (!isVisible) return null

    return (
        <div className="fixed inset-x-4 z-[100] animate-in fade-in slide-up duration-500 bottom-[calc(env(safe-area-inset-bottom)+6rem)] md:inset-x-auto md:right-8 md:w-full md:max-w-[320px] md:bottom-8">
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-xl">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="h-12 w-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center">
                            <Logo size={30} />
                        </div>
                        <button
                            aria-label="Dismiss install prompt"
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-zinc-100/80 hover:text-foreground dark:hover:bg-zinc-800/80"
                            onClick={handleDismiss}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <h4 className="font-black text-base tracking-tight">Install KhataPlus</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            Get quicker access, better offline reliability, and app-like performance.
                        </p>
                    </div>

                    {isIOS && !deferredPrompt ? (
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                            On iPhone: tap <span className="font-semibold">Share</span> then <span className="font-semibold">Add to Home Screen</span>.
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-tight rounded-2xl h-12 transition-colors"
                            onClick={handleInstall}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Install App
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
