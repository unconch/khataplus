"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Script from "next/script"
import { Check, Crown, MessageSquare, FileText, Package, Zap, Sparkles, Star, Shield, Smartphone, Globe, Clock, ShieldCheck, ZapOff } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { toast } from "sonner"
import type { BillingPlanKey } from "@/lib/billing-plans"

declare global {
    interface Window {
        Cashfree?: any
    }
}

export function PricingSection({
    orgCount,
    isAuthenticated = false,
    orgSlug = null
}: {
    orgCount?: number
    isAuthenticated?: boolean
    orgSlug?: string | null
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")
    const [loadingPlanKey, setLoadingPlanKey] = useState<BillingPlanKey | null>(null)
    const [isCashfreeLoaded, setIsCashfreeLoaded] = useState(false)
    const [paymentToastShown, setPaymentToastShown] = useState(false)

    interface PricingTier {
        planKey: BillingPlanKey
        name: string
        price: { monthly: number; yearly: number }
        desc: string
        features: string[]
        cta: string
        color: string
        popular: boolean
        note?: string
    }

    const tiers: PricingTier[] = [
        {
            planKey: "keep",
            name: "Keep",
            price: { monthly: 49, yearly: 399 },
            desc: "Data alive cheaply.",
            features: [
                "Data preserved & safe",
                "10 Invoices/mo",
                "30 Inventory Items",
                "Customer Ledger",
                "Regional Languages",
                "WhatsApp Share"
            ],
            cta: "Get Keep",
            color: "zinc",
            popular: false
        },
        {
            planKey: "starter",
            name: "Starter",
            price: { monthly: 179, yearly: 1499 },
            desc: "Small shops ready to grow.",
            features: [
                "Unlimited Invoices",
                "200 Inventory Items",
                "3 Staff Seats",
                "A4 + Thermal PDF Billing",
                "Import from Vyapar / CSV",
                "Regional Languages"
            ],
            cta: "Go Starter",
            color: "blue",
            popular: false
        },
        {
            planKey: "pro",
            name: "Pro",
            price: { monthly: 449, yearly: 3999 },
            desc: "Growing businesses.",
            features: [
                "Unlimited Inventory",
                "Business Intelligence",
                "GST Portal Sync",
                "Public Shop Profile",
                "PWA — Works Offline",
                "3 Store Locations"
            ],
            cta: "Go Pro",
            color: "emerald",
            popular: true
        },
        {
            planKey: "business",
            name: "Business",
            price: { monthly: 899, yearly: 7999 },
            desc: "Multi-location SMEs.",
            features: [
                "Unlimited Staff & Locations",
                "WhatsApp Automation (v2)",
                "Advanced GST Reporting",
                "Dedicated Support",
                "Audit Logs & SLA",
                "AI Stock Custom (v3)"
            ],
            cta: "Go Business",
            color: "indigo",
            popular: false
        }
    ]

    useEffect(() => {
        const payment = searchParams.get("payment")
        if (!payment || paymentToastShown) return

        const message = searchParams.get("message")
        if (payment === "success") {
            toast.success(message || "Payment successful. Plan activated.")
        } else if (payment === "failed") {
            toast.error(message || "Payment verification failed.")
        }
        setPaymentToastShown(true)
    }, [searchParams, paymentToastShown])

    const getCashfreeInstance = (environment: string) => {
        const factory = window.Cashfree
        if (!factory) {
            throw new Error("Cashfree SDK not loaded. Please refresh and try again.")
        }
        const mode = environment === "production" || environment === "live" ? "production" : "sandbox"
        return factory({ mode })
    }

    const handleCheckout = async (planKey: BillingPlanKey) => {
        if (!isAuthenticated) {
            router.push("/auth/login")
            return
        }
        if (!isCashfreeLoaded) {
            toast.error("Cashfree SDK is still loading. Try again in a moment.")
            return
        }

        setLoadingPlanKey(planKey)
        try {
            const response = await fetch("/api/billing/cashfree/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan: planKey,
                    cycle: billingCycle
                })
            })

            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data?.error || "Failed to initialize checkout")
            }

            if (!data?.paymentSessionId) {
                throw new Error("Missing payment session from Cashfree")
            }

            const cashfree = getCashfreeInstance(String(data.environment || "sandbox"))
            const checkoutResult = await cashfree.checkout({
                paymentSessionId: data.paymentSessionId,
                redirectTarget: "_self"
            })
            if (checkoutResult?.error) {
                throw new Error(checkoutResult.error.message || "Unable to open checkout")
            }
        } catch (error: any) {
            toast.error(error?.message || "Unable to start payment")
        } finally {
            setLoadingPlanKey(null)
        }
    }

    const handleStartTrial = () => {
        if (!isAuthenticated) {
            router.push("/auth/sign-up")
            return
        }
        if (orgSlug) {
            router.push(`/${orgSlug}/dashboard`)
            return
        }
        router.push("/setup-organization")
    }

    return (
        <section id="pricing" className="relative py-24 md:py-40 px-6 overflow-hidden bg-white">
            <Script
                src="https://sdk.cashfree.com/js/v3/cashfree.js"
                strategy="afterInteractive"
                onLoad={() => setIsCashfreeLoaded(true)}
            />
            <div className="max-w-7xl mx-auto relative z-10">

                {/* Trial/Entry Strategy Callout */}
                <AdvancedScrollReveal variant="slideUp">
                    <div
                        className="max-w-4xl mx-auto mb-32 p-8 md:p-12 rounded-[2.5rem] bg-zinc-950 text-white relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-all duration-700" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                                <Clock size={40} className="text-emerald-400" strokeWidth={1.5} />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-2xl md:text-3xl font-black mb-3 tracking-tight italic">30-Day Full Access Trial.</h3>
                                <p className="text-zinc-400 text-sm md:text-base font-medium leading-relaxed max-w-xl">
                                    No credit card. No commitment. Explore every Pro feature for 30 days.
                                    Downgrades to read-only on Day 30 if no plan selected. Your data is always safe.
                                </p>
                            </div>
                            <div className="w-full md:w-auto">
                                <button
                                    onClick={handleStartTrial}
                                    className="w-full md:px-10 py-4 bg-white text-zinc-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5"
                                >
                                    Start Trial
                                </button>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-zinc-800/50 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" /> No credit card
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                <Zap size={14} className="text-emerald-500" /> Instant Setup
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                <Smartphone size={14} className="text-emerald-500" /> Full Mobile Sync
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                <Globe size={14} className="text-emerald-500" /> Built for Bharat
                            </div>
                        </div>
                    </div>
                </AdvancedScrollReveal>

                {/* Platform Tiers Toggle & Header */}
                <div className="text-center mb-32 cursor-default relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

                    {orgCount && orgCount > 5 && (
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full mb-8 animate-in fade-in duration-700"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                Powering {orgCount.toLocaleString()}+ Shops Pan-Bharat
                            </span>
                        </div>
                    )}

                    <AdvancedScrollReveal variant="slideUp">
                        <h2
                            className="text-5xl md:text-8xl font-black tracking-tighter text-zinc-950 mb-8 leading-[0.9]"
                        >
                            The Better Way <br />
                            <span className="text-zinc-300 italic">to Build & Bill.</span>
                        </h2>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={200}>
                        <p
                            className="text-zinc-500 font-medium text-lg md:text-xl mb-16 max-w-3xl mx-auto leading-relaxed"
                        >
                            Honest pricing for Bharat's most ambitious shops. <br />
                            <span className="text-zinc-400">Upgrade from legacy tools in minutes. No hidden costs. No compromises.</span>
                        </p>
                    </AdvancedScrollReveal>

                    {/* Differentiator Grid */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-20 pointer-events-none">
                        {[
                            { icon: <Zap className="text-emerald-500" size={18} />, label: "Switch from Vyapar", sub: "2-min instant import" },
                            { icon: <ZapOff className="text-emerald-500" size={18} />, label: "Works Offline", sub: "Bill without internet" },
                            { icon: <Star className="text-emerald-500" size={18} />, label: "Public Profile", sub: "WhatsApp ordering" },
                        ].map((item, idx) => (
                            <AdvancedScrollReveal key={idx} variant="slideUp" delay={300 + idx * 100}>
                                <div
                                    className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-zinc-50/50 border border-zinc-100"
                                >
                                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100 mb-2">
                                        {item.icon}
                                    </div>
                                    <span className="text-zinc-950 font-black text-sm">{item.label}</span>
                                    <span className="text-zinc-500 text-[11px] font-medium">{item.sub}</span>
                                </div>
                            </AdvancedScrollReveal>
                        ))}
                    </div>

                    <div className="inline-flex p-1.5 bg-white rounded-2xl border border-zinc-200 shadow-sm relative z-10 transition-transform active:scale-95">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${billingCycle === "monthly" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all relative ${billingCycle === "yearly" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            Yearly
                            <span className="absolute -top-4 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-lg">~25% OFF</span>
                        </button>
                    </div>
                </div>

                {/* The 4-Tier Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {tiers.map((tier, i) => (
                        <AdvancedScrollReveal key={i} variant="slideUp" delay={i * 100} className="flex h-full">
                            <div
                                className={`group relative bg-white rounded-3xl p-8 border ${tier.popular ? 'border-emerald-500/30' : 'border-zinc-100'} hover:border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col w-full`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                        RECOMMENDED
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-zinc-950 mb-1">{tier.name}</h3>
                                    <p className="text-zinc-500 text-[13px] font-medium leading-relaxed min-h-[40px]">{tier.desc}</p>
                                </div>

                                <div className="mb-10">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-zinc-950 tracking-tighter">
                                            ₹{tier.price[billingCycle].toLocaleString()}
                                        </span>
                                        <span className="text-zinc-400 font-bold text-xs uppercase tracking-tighter">
                                            /{billingCycle === "yearly" ? "yr" : "mo"}
                                        </span>
                                    </div>
                                    {billingCycle === "yearly" && (
                                        <div className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest mt-1">
                                            Equivalent to ₹{Math.floor(tier.price.yearly / 12)}/mo
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 mb-12 flex-1 border-t border-zinc-50 pt-8">
                                    {tier.features.map((feat, j) => (
                                        <div key={j} className="flex items-start gap-3 text-zinc-600 text-[13px] font-medium leading-tight">
                                            <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={3} />
                                            {feat}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleCheckout(tier.planKey)}
                                    disabled={loadingPlanKey !== null}
                                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${tier.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                >
                                    {loadingPlanKey === tier.planKey ? "Processing..." : tier.cta}
                                </button>
                            </div>
                        </AdvancedScrollReveal>
                    ))}
                </div>


            </div>
        </section>
    )
}
