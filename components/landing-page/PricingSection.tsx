"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, Lock, Shield, Sparkles, Zap } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { toast } from "sonner"
import type { BillingPlanKey } from "@/lib/billing-plans"
import { cn } from "@/lib/utils"

const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)

const RAZORPAY_SDK_PRIMARY_SRC = "/api/billing/razorpay/sdk"
const RAZORPAY_SDK_FALLBACK_SRC = "https://checkout.razorpay.com/v1/checkout.js"
const RAZORPAY_SDK_SOURCES = [RAZORPAY_SDK_PRIMARY_SRC, RAZORPAY_SDK_FALLBACK_SRC] as const

declare global {
    interface Window {
        Razorpay?: any
    }
}

type BillingCycle = "monthly" | "yearly"

interface PricingTier {
    id: string
    kind?: "trial" | "paid"
    planKey: BillingPlanKey
    name: string
    icon: any
    price: { monthly: number; yearly: number }
    desc: string
    features: string[]
    cta: string
    popular?: boolean
    lockedGst?: boolean
}

const trialFeatures = [
    "Full Starter features",
    "No card needed",
]

const tiers: PricingTier[] = [
    {
        id: "trial",
        kind: "trial",
        planKey: "starter",
        name: "Free Trial",
        icon: Sparkles,
        price: { monthly: 0, yearly: 0 },
        desc: "14 days free, full Starter access.",
        features: [
            "Full Starter features",
            "No card needed"
        ],
        cta: "Start 14-day trial",
    },
    {
        id: "keep",
        planKey: "keep",
        name: "Keep",
        icon: Shield,
        price: { monthly: 49, yearly: 499 },
        desc: "For shops getting started.",
        features: [
            "25 Invoices / Month",
            "1 Staff Seat",
            "1 Store Location",
            "50 Inventory Items",
            "CSV Import",
            "Basic Billing Reports"
        ],
        cta: "Start 14-day trial",
        lockedGst: true
    },
    {
        id: "starter",
        planKey: "starter",
        name: "Starter",
        icon: Zap,
        price: { monthly: 199, yearly: 1999 },
        desc: "For growing local shops.",
        features: [
            "Unlimited Billing",
            "3 Staff Seats",
            "2 Store Locations",
            "500 Inventory Items",
            "GST Billing",
            "WhatsApp Sharing",
            "Basic Analytics",
            "CSV Import"
        ],
        cta: "Start 14-day trial",
    },
]


function PricingContent({
    orgCount: _orgCount = 0,
    isAuthenticated = false,
    orgSlug = null
}: {
    orgCount?: number
    isAuthenticated?: boolean
    orgSlug?: string | null
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly")
    const [loadingPlanKey, setLoadingPlanKey] = useState<BillingPlanKey | null>(null)
    const [paymentToastShown, setPaymentToastShown] = useState(false)
    const [pulseStarterCard, setPulseStarterCard] = useState(false)
    const accentByPlan: Record<BillingPlanKey, string> = {
        keep: "emerald",
        starter: "sky",
    }

    useEffect(() => {
        const payment = searchParams.get("payment")
        if (!payment || paymentToastShown) return
        const message = searchParams.get("message")
        if (payment === "success") toast.success(message || "Payment successful. Plan activated.")
        else if (payment === "failed") toast.error(message || "Payment verification failed.")
        setPaymentToastShown(true)
    }, [searchParams, paymentToastShown])

    useEffect(() => {
        const highlight = searchParams.get("highlight")
        if (highlight !== "starter") return

        setPulseStarterCard(true)
        const timeout = window.setTimeout(() => setPulseStarterCard(false), 3200)
        return () => window.clearTimeout(timeout)
    }, [searchParams])

    const triggerStarterPulse = () => {
        setPulseStarterCard(true)
        window.setTimeout(() => setPulseStarterCard(false), 2800)
    }

    const ensureRazorpayScript = async () => {
        if (typeof window === "undefined") throw new Error("Checkout is only available in browser mode.")
        if (window.Razorpay) return

        let lastError: unknown = null

        for (const src of RAZORPAY_SDK_SOURCES) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
                    if (existing) {
                        existing.addEventListener("load", () => resolve(), { once: true })
                        existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay SDK")), { once: true })
                        return
                    }

                    const script = document.createElement("script")
                    script.src = src
                    script.async = true
                    script.dataset.razorpaySdk = "true"
                    script.onload = () => resolve()
                    script.onerror = () => reject(new Error(`Failed to load Razorpay SDK from ${src}`))
                    document.head.appendChild(script)
                })

                if (window.Razorpay) return
            } catch (error) {
                lastError = error
            }
        }

        throw new Error((lastError as Error)?.message || "Failed to load Razorpay SDK")
    }

    const handleCheckout = async (planKey: BillingPlanKey) => {
        setLoadingPlanKey(planKey)
        try {
            await ensureRazorpayScript()

            const response = await fetch("/api/billing/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planKey, cycle: billingCycle })
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) throw new Error(data?.error || "Failed to initialize checkout")

            if (!data?.orderId || !data?.keyId) {
                throw new Error("Missing order details")
            }

            const rzp = new window.Razorpay({
                key: data.keyId,
                amount: data.amount,
                currency: data.currency || "INR",
                name: "KhataPlus",
                description: `${planKey.toUpperCase()} | ${billingCycle}`,
                order_id: data.orderId,
                handler: async (response: any) => {
                    setLoadingPlanKey(planKey)
                    try {
                        const verifyRes = await fetch("/api/billing/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orgId: orgSlug || "demo-org", // In real flow, get current orgId
                                plan: planKey,
                                cycle: billingCycle
                            })
                        })
                        const verifyData = await verifyRes.json()
                        if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed")

                        toast.success("Payment successful. Plan activated.")
                        router.push("/pricing?payment=success")
                    } catch (err: any) {
                        toast.error(err.message || "Payment verification failed")
                    } finally {
                        setLoadingPlanKey(null)
                    }
                },
            })
            rzp.on("payment.failed", (err: any) => {
                toast.error(err?.error?.description || "Payment failed. Please try again.")
            })
            rzp.open()
        } catch (error: any) { toast.error(error?.message || "Checkout failed") }
        finally { setLoadingPlanKey(null) }
    }

    const handleStartTrial = () => {
        if (!isAuthenticated) { router.push("/auth/sign-up"); return; }
        if (orgSlug) { router.push(`/${orgSlug}/dashboard`); return; }
        router.push("/setup-organization")
    }

    return (
        <section id="pricing" className="relative overflow-visible bg-transparent py-16 md:py-24">
            <div
                className="absolute inset-0 pointer-events-none opacity-90"
                style={{
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)"
                }}
            >
                <div className="absolute -left-32 top-0 h-[440px] w-[440px] bg-emerald-500/20 blur-[150px]" />
                <div className="absolute right-[-140px] top-1/4 h-[420px] w-[420px] bg-sky-500/18 blur-[180px]" />
                <div className="absolute left-1/2 bottom-[-240px] h-[560px] w-[560px] -translate-x-1/2 bg-violet-400/14 blur-[230px]" />
                <div className="absolute left-[14%] top-[44%] h-[260px] w-[260px] bg-amber-400/10 blur-[130px]" />
            </div>
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-6 mb-16">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="space-y-3 px-2 py-2">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">
                                Simple pricing that scales with your shop.
                            </h2>
                            <p className="text-zinc-600 text-base font-medium max-w-xl mx-auto leading-relaxed">
                                Start with Keep and upgrade only when you need advanced billing and growth tools.
                            </p>
                        </div>
                    </AdvancedScrollReveal>

                    <div className="flex items-center justify-center rounded-2xl border border-white/85 bg-white/90 p-1.5 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.18)] backdrop-blur-sm">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={cn(
                                "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300",
                                billingCycle === "monthly" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={cn(
                                "relative rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300",
                                billingCycle === "yearly" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"
                            )}
                        >
                            Annual
                            <span className="absolute -top-2 -right-3 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-full">Save 17%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-3 max-w-6xl mx-auto">
                    {tiers.map((tier, i) => (
                        <AdvancedScrollReveal key={tier.id} variant="slideUp" delay={i * 50}>
                            <div className={cn(
                                "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-7 transition-all duration-300",
                                tier.planKey === "starter" && pulseStarterCard && "ring-2 ring-emerald-400 ring-offset-2 animate-pulse",
                                tier.kind === "trial" && "border-emerald-200/90 bg-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.12)]",
                                tier.popular
                                    ? "bg-gradient-to-br from-zinc-950 via-slate-900 to-slate-950 border-zinc-900 shadow-xl z-10"
                                    : "border-zinc-200/95 bg-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.1)]",
                                accentByPlan[tier.planKey] === "emerald" && "ring-1 ring-emerald-300/80",
                                accentByPlan[tier.planKey] === "sky" && "ring-1 ring-sky-300/80",
                                accentByPlan[tier.planKey] === "violet" && "ring-1 ring-violet-100/70"
                            )}>
                                {!tier.popular && (
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.03),transparent_32%)]" />
                                )}
                                {tier.popular && (
                                    <div className="absolute top-4 right-4 bg-emerald-500 text-zinc-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wide">
                                        Popular
                                    </div>
                                )}

                                <div className="space-y-4 mb-8">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl",
                                        tier.kind === "trial"
                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                            : tier.popular
                                                ? "bg-zinc-900 border border-zinc-700 text-emerald-400"
                                                : tier.planKey === "keep"
                                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border border-sky-200 bg-sky-50 text-sky-700"
                                    )}>
                                        <tier.icon size={22} />
                                    </div>
                                    <div>
                                        <h3 className={cn("text-2xl font-bold", tier.popular ? "text-white" : "text-zinc-900")}>{tier.name}</h3>
                                        <p className={cn("text-sm font-medium leading-relaxed", tier.popular ? "text-zinc-400" : "text-zinc-600")}>{tier.desc}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    {tier.kind === "trial" ? (
                                        <div>
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-black tracking-tight text-zinc-900">Free</span>
                                                <span className="text-sm font-semibold pb-1 text-zinc-600">for 14 days</span>
                                            </div>
                                            <div className="text-emerald-600 font-semibold text-sm mt-1">
                                                Full Starter access
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-end gap-1">
                                                <span className={cn("text-4xl font-black tracking-tight", tier.popular ? "text-white" : "text-zinc-900")}>
                                                    {formatINR(tier.price[billingCycle])}
                                                </span>
                                                <span className={cn("text-sm font-semibold pb-1", tier.popular ? "text-zinc-400" : "text-zinc-600")}>
                                                    /{billingCycle === "yearly" ? "yr" : "mo"}
                                                </span>
                                            </div>
                                            {billingCycle === "yearly" && (
                                                <div className="text-emerald-600 font-semibold text-sm mt-1">
                                                    {formatINR(Math.floor(tier.price.yearly / 12))}/mo
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className={cn("mb-8 flex-1 space-y-3 border-t pt-6", tier.popular ? "border-zinc-800" : "border-zinc-300/90")}>
                                    {tier.features.map((feat) => (
                                        <div key={feat} className="flex items-center gap-2.5">
                                            <Check size={14} className={tier.popular ? "text-emerald-400" : "text-emerald-700"} />
                                            <span className={cn("text-sm font-medium", tier.popular ? "text-zinc-300" : "text-zinc-800")}>{feat}</span>
                                        </div>
                                    ))}
                                    {tier.lockedGst && (
                                        <button
                                            type="button"
                                            onClick={triggerStarterPulse}
                                            className="mt-1 flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <Lock size={13} className="text-zinc-400" />
                                                <span className="text-sm text-zinc-500 font-medium">GST Billing</span>
                                            </span>
                                            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Starter &amp; Above -&gt;</span>
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        if (tier.kind === "trial" || tier.planKey === "keep") {
                                            handleStartTrial()
                                            return
                                        }
                                        handleCheckout(tier.planKey)
                                    }}
                                    disabled={loadingPlanKey !== null}
                                    className={cn(
                                        "w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors",
                                        tier.popular
                                            ? "bg-white text-zinc-950 hover:bg-zinc-100"
                                            : "bg-zinc-950 text-white hover:bg-zinc-800"
                                    )}
                                >
                                    {loadingPlanKey === tier.planKey ? "..." : tier.cta}
                                </button>
                            </div>
                        </AdvancedScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function PricingSection(props: {
    orgCount?: number
    isAuthenticated?: boolean
    orgSlug?: string | null
}) {
    return (
        <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
            <PricingContent {...props} />
        </Suspense>
    )
}
