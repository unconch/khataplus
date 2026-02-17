"use client"

import { useState } from "react"
import { Share2, Users, Smartphone, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ReferralCard() {
    const [copied, setCopied] = useState(false)
    const referralLink = "https://khataplus.online?ref=invite"
    const shareMessage = `Hey! I'm using KhataPlus for my shop billing and ledger. It's super fast and works offline too. Check it out: ${referralLink}`

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        toast.success("Referral link copied!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleWhatsAppShare = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
        window.open(url, "_blank")
    }

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] p-10 bg-zinc-900 text-white shadow-2xl">
            {/* Immersive Gradient Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-90 transition-transform duration-1000 group-hover:scale-110" />

            {/* Animated Mesh Noise Overlay (Simulated with opacity) */}
            <div className="absolute inset-x-0 top-0 h-32 bg-white/10 blur-[100px] animate-pulse pointer-events-none" />

            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transition-all duration-700 group-hover:scale-125 group-hover:rotate-45">
                <Users size={160} strokeWidth={2.5} />
            </div>

            <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                        <Share2 size={12} className="text-blue-200" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-100">Growth Loop</span>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none">
                            Grow the <span className="text-blue-200">Network.</span>
                        </h3>
                        <p className="text-blue-100/70 text-sm lg:text-base font-bold max-w-sm leading-relaxed tracking-tight">
                            Help fellow shopkeepers digitize their ledger and earn premium rewards as an early pioneer.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={handleWhatsAppShare}
                        className="h-14 px-8 bg-white text-indigo-700 hover:bg-white/90 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                    >
                        <Smartphone size={18} />
                        Share on WhatsApp
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleCopy}
                        className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest backdrop-blur-sm border border-white/20 flex items-center gap-3 active:scale-95 transition-all"
                    >
                        {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                        {copied ? "Link Copied" : "Copy Secret Link"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
