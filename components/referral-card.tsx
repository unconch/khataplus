"use client"

import { useState } from "react"
import { Share2, Users, Smartphone, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
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
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-8 lg:p-10 rounded-[2rem] lg:rounded-[3rem] shadow-2xl relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-45">
                <Users size={140} strokeWidth={2} />
            </div>

            <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                        <Share2 size={12} className="text-blue-200" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-100">Growth Loop</span>
                    </div>
                    <h3 className="text-2xl lg:text-4xl font-black italic tracking-tight">Invite a fellow Shopkeeper</h3>
                    <p className="text-blue-100/70 text-sm lg:text-lg font-medium max-w-md leading-relaxed">
                        Helping other businesses digitize makes our community stronger. Share KhataPlus and help a friend grow.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        onClick={handleWhatsAppShare}
                        className="h-14 px-8 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95"
                    >
                        <Smartphone size={18} />
                        Share on WhatsApp
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleCopy}
                        className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-sm flex items-center gap-3 transition-all active:scale-95"
                    >
                        {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                        {copied ? "Copied!" : "Copy Link"}
                    </Button>
                </div>

            </div>
        </div>
    )
}
