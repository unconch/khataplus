"use client"

import {
    Store,
    MapPin,
    Phone,
    Clock,
    BadgeCheck,
    Share2,
    ShoppingBag,
    MessageSquare,
    ExternalLink,
    Star,
    Rocket,
    ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

interface PublicShopProps {
    shopName: string
    category: string
    city: string
    phone: string
    isVerified?: boolean
}

export function PublicShopProfile({ shopName, category, city, phone, isVerified = true }: PublicShopProps) {
    const shareShop = () => {
        if (navigator.share) {
            navigator.share({
                title: shopName,
                text: `Check out ${shopName} on KhataPlus!`,
                url: window.location.href
            })
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            {/* Minimal Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-white/5 h-20 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Logo size={28} />
                    <span className="font-black italic tracking-tighter text-lg">KHATAPLUS</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={shareShop} className="rounded-xl">
                        <Share2 size={20} />
                    </Button>
                    <Link href="/auth/sign-up">
                        <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4">
                            Create Mine
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Shop Hero */}
            <div className="max-w-4xl mx-auto px-6 pt-12 space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 shadow-xl border border-zinc-100 dark:border-white/5 space-y-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-10 -mt-10">
                        <Store size={180} />
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                <Rocket size={12} /> {category}
                            </div>
                            {isVerified && (
                                <div className="flex items-center gap-1 text-blue-500 font-black text-[10px] uppercase tracking-widest">
                                    <ShieldCheck size={14} /> Verified Shop
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">{shopName.toUpperCase()}</h1>

                        <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-emerald-500" /> {city}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-emerald-500" /> Open Now
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-amber-500" /> 4.9 ({50 + Math.floor(Math.random() * 100)} Reviews)
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 relative z-10">
                        <Button className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <MessageSquare size={20} /> Order via WhatsApp
                        </Button>
                        <Button variant="outline" className="h-16 rounded-[2rem] border-2 border-zinc-100 dark:border-white/10 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                            <Phone size={20} /> Call Shop
                        </Button>
                    </div>
                </motion.div>

                {/* Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-md border border-zinc-100 dark:border-white/5 space-y-4"
                    >
                        <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
                            <ShoppingBag className="text-emerald-500" /> Business Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-zinc-50 dark:border-white/5 pb-2">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">GST Status</span>
                                <span className="text-xs font-black text-emerald-600">Active</span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-50 dark:border-white/5 pb-2">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Payment Methods</span>
                                <span className="text-xs font-black">UPI, Cash, Khata</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Delivery</span>
                                <span className="text-xs font-black">Available within 5km</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-xl font-black italic tracking-tight">Claim Your Business</h3>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                Are you the owner of {shopName}? Digitize your billing and ledger for free with KhataPlus.
                            </p>
                            <Link href="/auth/sign-up" className="block">
                                <Button className="w-full h-12 bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                    Start Now - It's Free
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Product Teaser/Catalogue Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] shadow-sm border border-zinc-100 dark:border-white/5 text-center space-y-6"
                >
                    <div className="mx-auto h-16 w-16 bg-zinc-50 dark:bg-white/5 rounded-full flex items-center justify-center text-zinc-300">
                        <ShoppingBag size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black italic tracking-tight text-zinc-400">Catalogue Coming Soon</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">This merchant is currently setting up their digital store.</p>
                    </div>
                </motion.div>
            </div>

            {/* Footer Attribution */}
            <div className="max-w-4xl mx-auto px-6 pt-20 text-center space-y-6 opacity-30">
                <div className="flex items-center justify-center gap-2">
                    <Logo size={20} />
                    <span className="font-black italic tracking-tighter">Powered by KHATAPLUS</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">Digital India Initiative for Small Businesses</p>
            </div>
        </div>
    )
}
