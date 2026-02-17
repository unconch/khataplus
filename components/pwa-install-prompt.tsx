"use client"

import { useState, useEffect } from "react"
import { Download, X, Sparkles, Smartphone } from "lucide-react"
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
            setTimeout(() => setIsVisible(true), 5000)
        }

        window.addEventListener("beforeinstallprompt", handler)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false)
        }

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        trigger("medium")
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

    if (!isVisible) return null

    return (
        <div
            className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100] max-w-[320px] w-full animate-in fade-in slide-up duration-500"
        >
            <div className="relative group p-1">
                {/* Animated Border Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />

                <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-6 rounded-[2rem] shadow-2xl overflow-hidden">
                    {/* Decorative Sparkle */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Sparkles size={60} className="text-emerald-500" />
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Smartphone size={28} />
                            </div>
                            <button
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-black italic text-lg tracking-tight">KhataPlus Pocket</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                Install the native experience for lightning fast access and
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold italic ml-1">full offline power</span>.
                            </p>
                        </div>

                        <Button
                            size="lg"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black italic tracking-tight rounded-2xl h-14 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={handleInstall}
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Get App
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
