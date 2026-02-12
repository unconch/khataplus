"use client"

import { useState } from "react"
import {
    CheckCircle2,
    Rocket,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Star,
    Zap,
    Users,
    MessageSquare,
    Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Logo } from "@/components/ui/logo"

export function BetaEnrollment() {
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle")
    const [email, setEmail] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setStatus("submitting")
        // Simulate API call
        setTimeout(() => {
            setStatus("success")
            toast.success("Welcome to the Founders Club!")
        }, 1500)
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-24 space-y-20">
            {/* Hero Section */}
            <div className="text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest"
                >
                    <Rocket size={14} className="animate-bounce" />
                    Limited Beta Enrollment Open
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none"
                >
                    JOIN THE <span className="text-emerald-500 font-black">FOUNDERS</span> CLUB
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    We're looking for 500 ambitious Indian shop owners to shape the future of digital billing.
                </motion.p>
            </div>

            {/* Incentive Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    {
                        icon: <Zap className="text-amber-500" />,
                        title: "LIFETIME FREE",
                        desc: "Get all premium features free, forever. No subscriptions, ever."
                    },
                    {
                        icon: <Star className="text-blue-500" />,
                        title: "FOUNDER BADGE",
                        desc: "A unique verified badge on your shop profile that says you were here first."
                    },
                    {
                        icon: <MessageSquare className="text-emerald-500" />,
                        title: "DIRECT INPUT",
                        desc: "Talk directly to our engineers. Build the features YOU need."
                    }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-white/5 space-y-4 hover:scale-[1.02] transition-transform"
                    >
                        <div className="h-12 w-12 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-black italic tracking-tight">{item.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* The Hook Form */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-zinc-900 rounded-[3.5rem] p-8 md:p-16 text-white relative overflow-hidden group shadow-[0_50px_100px_-20px_rgba(16,185,129,0.3)]"
            >
                <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 -mr-20 -mt-20">
                    <Logo size={300} color="white" />
                </div>

                <div className="max-w-xl relative z-10 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">Claim Your Spot</h2>
                        <p className="text-zinc-400 font-medium">Be part of the digital revolution for small businesses. We launch publicly in 30 days.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {status !== "success" ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <Input
                                    type="email"
                                    required
                                    placeholder="Enter your email or phone"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-16 rounded-2xl bg-white/10 border-white/10 text-white placeholder:text-white/40 font-bold focus:ring-emerald-500"
                                />
                                <Button
                                    disabled={status === "submitting"}
                                    type="submit"
                                    className="h-16 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95"
                                >
                                    {status === "submitting" ? "Enrolling..." : "Join the Club"}
                                    <ArrowRight size={18} />
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-6 p-6 bg-emerald-500/20 border border-emerald-500/20 rounded-3xl"
                            >
                                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <p className="text-xl font-black italic">You're on the list!</p>
                                    <p className="text-emerald-100/60 text-sm font-bold uppercase tracking-widest">Watch your inbox for the secret link.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                                    <Users size={14} className="text-zinc-500" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-500">
                            {470 + Math.floor(Math.random() * 20)}/500 SPOTS TAKEN
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Social Proof Section */}
            <div className="text-center space-y-12">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Loved by shop owners across India</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale">
                    {/* Placeholder for real merchant logos */}
                    <div className="font-black italic text-xl">Kirana Store</div>
                    <div className="font-black italic text-xl">Pharmacy</div>
                    <div className="font-black italic text-xl">Hardware Store</div>
                    <div className="font-black italic text-xl">Clothing Hub</div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="pt-20 border-t border-zinc-100 dark:border-white/5 text-center">
                <div className="flex items-center justify-center gap-3 opacity-30">
                    <Logo size={20} />
                    <span className="font-black italic tracking-tighter">KHATAPLUS</span>
                </div>
            </div>
        </div>
    )
}
