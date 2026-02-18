"use client"

import React from "react"
import { AlertCircle, CreditCard, ExternalLink, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

interface TrialExpiredGuardProps {
    children: React.ReactNode
    trialEndsAt: string
    subscriptionStatus: string
    orgName: string
}

export function TrialExpiredGuard({ children, trialEndsAt, subscriptionStatus, orgName }: TrialExpiredGuardProps) {
    const isTrial = subscriptionStatus === 'trial'
    const trialDate = new Date(trialEndsAt)
    const now = new Date()
    const isExpired = isTrial && trialDate < now

    if (!isExpired) {
        return <>{children}</>
    }

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center p-6 overflow-auto">
            <div className="max-w-xl w-full">
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 text-center">
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                                <div className="w-20 h-20 bg-zinc-950 border border-red-500/50 rounded-3xl flex items-center justify-center text-red-500 relative">
                                    <ShieldAlert size={40} />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                            Trial Expired
                        </h1>
                        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                            The 30-day free trial for <span className="text-white font-bold">{orgName}</span> has concluded. To continue managing your business, please choose a plan.
                        </p>

                        <div className="space-y-4 mb-10">
                            <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Base Plan</h4>
                                    <p className="text-zinc-500 text-xs">Unlock all core billing features for ₹149/mo.</p>
                                </div>
                                <div className="ml-auto text-emerald-400 font-black">
                                    ₹149
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">WhatsApp Suite</h4>
                                    <p className="text-zinc-500 text-xs">Send automated invoices & reminders.</p>
                                </div>
                                <div className="ml-auto text-blue-400 font-black">
                                    ADD-ON
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href="/pricing">
                                <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/10">
                                    UPGRADE NOW
                                </Button>
                            </Link>
                            <div className="flex items-center gap-4 mt-2">
                                <Link href="/" className="flex-1">
                                    <Button variant="outline" className="w-full h-12 border-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-bold">
                                        Back to Home
                                    </Button>
                                </Link>
                                <Button variant="ghost" className="flex-1 h-12 text-zinc-500 hover:text-zinc-300 font-bold gap-2">
                                    <Mail size={16} /> Contact Support
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-zinc-800 flex items-center justify-center gap-2 text-zinc-600 text-xs font-medium">
                            <Logo size={16} className="opacity-20 grayscale" />
                            <span>KhataPlus Security Compliance</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
