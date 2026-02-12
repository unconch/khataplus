"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Share2, Printer, ArrowRight } from "lucide-react"
import { PriceDisplay } from "@/components/ui/price-display"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/hooks/use-haptic"

interface SignatureReceiptProps {
    amount: number
    customerName?: string
    paymentMethod: string
    itemCount: number
    onClose: () => void
    onNewSale: () => void
}

export function SignatureReceipt({
    amount,
    customerName,
    paymentMethod,
    itemCount,
    onClose,
    onNewSale,
}: SignatureReceiptProps) {
    const [isVisible, setIsVisible] = useState(false)
    const { trigger } = useHaptic()

    useEffect(() => {
        // Entrance animation delay
        const timer = setTimeout(() => setIsVisible(true), 100)
        trigger("success")
        return () => clearTimeout(timer)
    }, [trigger])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* The Receipt Card */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-[2rem] overflow-hidden shadow-2xl transform transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)",
                    isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-20 scale-95 opacity-0"
                )}
            >
                {/* Decorative Top Edge (zig-zag or simple accent) */}
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 w-full" />

                <div className="p-8 flex flex-col items-center text-center space-y-6 relative">
                    {/* Success Icon Bloom */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                        <div className="relative h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                            <CheckCircle2 className="h-10 w-10 animate-in zoom-in spin-in-12 duration-500" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Payment Received</p>
                        <div className="scale-125 transform origin-center py-2">
                            <PriceDisplay amount={amount} size="2xl" className="text-foreground" />
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{paymentMethod}</span>
                        </div>
                    </div>

                    {/* Receipt Details Ticket */}
                    <div className="w-full bg-zinc-50 dark:bg-white/5 rounded-2xl p-6 border border-zinc-100 dark:border-white/5 relative overflow-hidden group">
                        {/* Perforated edge visual at top */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-[linear-gradient(45deg,transparent_48%,rgba(0,0,0,0.05)_50%,transparent_52%)] bg-[length:10px_10px] opacity-20" />

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Items</span>
                                <span className="font-bold text-foreground">{itemCount} Products</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Customer</span>
                                <span className="font-bold text-foreground">{customerName || "Walk-in Customer"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Transaction ID</span>
                                <span className="font-mono text-xs text-foreground/50">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full pt-2">
                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl gap-2 font-bold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition-all text-foreground"
                            onClick={() => { trigger("medium"); onClose(); }}
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button
                            className="h-14 rounded-2xl gap-2 font-black bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-all"
                            onClick={() => { trigger("light"); /* Share logic */ }}
                        >
                            <Share2 className="h-4 w-4" />
                            WhatsApp
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground active:scale-95"
                        onClick={() => { trigger("light"); onNewSale(); }}
                    >
                        Start New Sale <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>

                    {/* Viral Branding */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-white/5 w-full">
                        <Link
                            href="https://khataplus.online?ref=receipt"
                            target="_blank"
                            className="text-[10px] font-bold text-muted-foreground/40 hover:text-emerald-500 transition-colors flex items-center justify-center gap-1.5 grayscale hover:grayscale-0"
                        >
                            <Logo size={12} />
                            POWERED BY KHATAPLUS
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}
