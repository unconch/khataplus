"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Script from "next/script"
import { Check, Loader2 } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { toast } from "sonner"
import type { BillingPlanKey } from "@/lib/billing-plans"

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)

const CASHFREE_PRIMARY_SDK_SRC = "/api/billing/cashfree/sdk"
const CASHFREE_FALLBACK_SDK_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js"
const CASHFREE_SDK_SOURCES = [CASHFREE_PRIMARY_SDK_SRC, CASHFREE_FALLBACK_SDK_SRC] as const

declare global {
    interface Window {
        Cashfree?: any
    }
}

type BillingCycle = "monthly" | "yearly"

interface PricingTier {
    planKey: BillingPlanKey
    name: string
    price: { monthly: number; yearly: number }
    desc: string
    features: string[]
    cta: string
    popular?: boolean
}

const tiers: PricingTier[] = [
    {
        planKey: "keep",
        name: "Keep",
        price: { monthly: 49, yearly: 399 },
        desc: "Keep your data alive, safely.",
        features: [
            "Data preserved & safe",
            "10 invoices/mo",
            "30 inventory items",
            "Customer ledger",
            "Regional languages",
            "WhatsApp share"
        ],
        cta: "Start free"
    },
    {
        planKey: "starter",
        name: "Starter",
        price: { monthly: 179, yearly: 1499 },
        desc: "Everything for small shops to grow.",
        features: [
            "Unlimited invoices",
            "200 inventory items",
            "3 staff seats",
            "A4 + thermal PDF billing",
            "Import from Vyapar / CSV",
            "Regional languages"
        ],
        cta: "Get Starter"
    },
    {
        planKey: "pro",
        name: "Pro",
        price: { monthly: 449, yearly: 3999 },
        desc: "For growing businesses that need more.",
        features: [
            "Unlimited inventory",
            "Business intelligence",
            "GST portal sync",
            "Public shop profile",
            "PWA — works offline",
            "3 store locations"
        ],
        cta: "Go Pro",
        popular: true
    },
    {
        planKey: "business",
        name: "Business",
        price: { monthly: 899, yearly: 7999 },
        desc: "Multi-location SMEs with teams.",
        features: [
            "Unlimited staff & locations",
            "WhatsApp automation (v2)",
            "Advanced GST reporting",
            "Dedicated support",
            "Audit logs & SLA",
            "AI stock custom (v3)"
        ],
        cta: "Talk to us"
    }
]

function PricingContent({
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
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly")
    const [loadingPlanKey, setLoadingPlanKey] = useState<BillingPlanKey | null>(null)
    const [isCashfreeLoaded, setIsCashfreeLoaded] = useState(false)
    const [paymentToastShown, setPaymentToastShown] = useState(false)

    useEffect(() => {
        const payment = searchParams.get("payment")
        if (!payment || paymentToastShown) return
        const message = searchParams.get("message")
        if (payment === "success") toast.success(message || "Payment successful. Plan activated.")
        else if (payment === "failed") toast.error(message || "Payment verification failed.")
        setPaymentToastShown(true)
    }, [searchParams, paymentToastShown])

    useEffect(() => {
        if (typeof window !== "undefined" && window.Cashfree) setIsCashfreeLoaded(true)
    }, [])

    const waitForCashfree = async (timeoutMs = 8000) => {
        const startedAt = Date.now()
        while (Date.now() - startedAt < timeoutMs) {
            if (typeof window !== "undefined" && window.Cashfree) {
                setIsCashfreeLoaded(true)
                return
            }
            await new Promise((resolve) => setTimeout(resolve, 150))
        }
        throw new Error("Cashfree checkout is unavailable right now. Please retry.")
    }

    const injectCashfreeScript = async (src: string) => {
        const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
        if (existingScript) return
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")
            script.src = src
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
            document.head.appendChild(script)
        })
    }

    const ensureCashfreeLoaded = async () => {
        if (typeof window === "undefined") throw new Error("Checkout is only available in browser mode.")
        if (window.Cashfree) {
            setIsCashfreeLoaded(true)
            return
        }
        let lastError: any = null
        for (const sdkSrc of CASHFREE_SDK_SOURCES) {
            try {
                await injectCashfreeScript(sdkSrc)
                await waitForCashfree(6000)
                return
            } catch (error) {
                lastError = error
            }
        }
        console.error("[Cashfree] SDK failed for all sources:", lastError)
        throw new Error("Payment checkout is blocked on this network. Please switch network/browser and retry.")
    }

    const getCashfreeInstance = (environment: string) => {
        const factory = window.Cashfree
        if (!factory) throw new Error("Cashfree SDK not loaded. Please refresh and try again.")
        const mode = environment === "production" || environment === "live" ? "production" : "sandbox"
        return factory({ mode })
    }

    const handleCheckout = async (planKey: BillingPlanKey) => {
        if (!isAuthenticated) {
            router.push("/auth/login")
            return
        }
        setLoadingPlanKey(planKey)
        try {
            const response = await fetch("/api/billing/cashfree/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planKey, cycle: billingCycle })
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) throw new Error(data?.error || "Failed to initialize checkout")
            if (!data?.paymentSessionId) throw new Error("Missing payment session from Cashfree")

            try {
                await ensureCashfreeLoaded()
                const cashfree = getCashfreeInstance(String(data.environment || "sandbox"))
                const checkoutResult = await cashfree.checkout({
                    paymentSessionId: data.paymentSessionId,
                    redirectTarget: "_self"
                })
                if (checkoutResult?.error) throw new Error(checkoutResult.error.message || "Unable to open checkout")
            } catch (sdkError) {
                const fallbackCheckoutUrl = String(data?.fallbackCheckoutUrl || "").trim()
                if (fallbackCheckoutUrl) {
                    window.location.assign(fallbackCheckoutUrl)
                    return
                }
                throw sdkError
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
        <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 py-10 md:py-14 px-6">
            <Script
                src={CASHFREE_PRIMARY_SDK_SRC}
                strategy="afterInteractive"
                onLoad={() => setIsCashfreeLoaded(true)}
                onError={() => setIsCashfreeLoaded(false)}
            />

            {/* background accents (kept subtle) */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 -left-16 w-80 h-80 bg-emerald-100 blur-[120px] rounded-full opacity-50" />
                <div className="absolute top-6 right-0 w-80 h-80 bg-sky-100 blur-[120px] rounded-full opacity-45" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center space-y-5 mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-[0.2em] shadow-sm">
                        Flexible for every stage
                    </div>
                    <AdvancedScrollReveal variant="slideUp">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 leading-[1.05]">
                            Pricing that scales with your shop
                        </h2>
                    </AdvancedScrollReveal>
                    <AdvancedScrollReveal variant="slideUp" delay={120}>
                        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto">
                            Start free, pay as you grow. No setup fees, no surprises—switch plans anytime.
                        </p>
                    </AdvancedScrollReveal>

                    <div className="inline-flex mt-6 p-1.5 bg-white rounded-2xl border border-zinc-200 shadow-md relative z-10 transition-transform active:scale-95">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${billingCycle === "monthly" ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-800"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all relative ${billingCycle === "yearly" ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-800"}`}
                        >
                            Yearly
                            <span className="absolute -top-4 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-lg">Save ~25%</span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {tiers.map((tier, i) => (
                        <AdvancedScrollReveal key={tier.planKey} variant="slideUp" delay={i * 80} className="flex h-full">
                            <div
                                className={`group relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border ${tier.popular ? 'border-emerald-500/40 shadow-[0_20px_60px_-25px_rgba(16,185,129,0.6)]' : 'border-zinc-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.3)]'} hover:-translate-y-1 transition-all duration-300 flex flex-col w-full`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                        Most picked
                                    </div>
                                )}

                                <div className="mb-7 space-y-2">
                                    <h3 className="text-xl font-bold text-zinc-950">{tier.name}</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed min-h-[40px]">{tier.desc}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
                                            {formatINR(tier.price[billingCycle])}
                                        </span>
                                        <span className="text-zinc-400 font-bold text-xs uppercase tracking-tighter">
                                            /{billingCycle === "yearly" ? "yr" : "mo"}
                                        </span>
                                    </div>
                                    {billingCycle === "yearly" && (
                                        <div className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest mt-1">
                                            ≈ {formatINR(Math.floor(tier.price.yearly / 12))}/mo billed yearly
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3.5 mb-8 flex-1 border-t border-zinc-100 pt-7">
                                    {tier.features.map((feat, j) => (
                                        <div key={j} className="flex items-start gap-3 text-zinc-700 text-[13px] font-medium leading-tight">
                                            <div className="rounded-full bg-emerald-50 text-emerald-600 p-1">
                                                <Check size={13} strokeWidth={3} />
                                            </div>
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => tier.planKey === "keep" ? handleStartTrial() : handleCheckout(tier.planKey)}
                                    disabled={loadingPlanKey !== null}
                                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${tier.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                                >
                                    {loadingPlanKey === tier.planKey ? "Processing..." : tier.cta}
                                </button>

                                <div className="absolute inset-x-6 -bottom-3 h-2 rounded-full blur-md opacity-20 bg-emerald-500 group-hover:opacity-40 transition-opacity" />
                            </div>
                        </AdvancedScrollReveal>
                    ))}
                </div>

                <div className="mt-12 max-w-5xl mx-auto">
                    <div className="rounded-[28px] bg-white shadow-[0_20px_60px_-35px_rgba(0,0,0,0.25)] border border-emerald-100/60 px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {[
                                "Live sync across mobile + desktop",
                                "GST-ready invoices in seconds",
                                "WhatsApp share + regional languages",
                            ].map((text) => (
                                <div
                                    key={text}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/90 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-semibold text-zinc-800">{text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center space-y-1 text-sm">
                            <div className="text-zinc-700 font-medium">Prices in ₹ INR, inclusive of applicable taxes. Cancel anytime.</div>
                            <div className="text-xs text-zinc-400">
                                Need something tailored? <a className="text-emerald-600 font-semibold" href="mailto:hello@khataplus.com">hello@khataplus.com</a>
                            </div>
                        </div>
                    </div>
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
        <Suspense fallback={
            <div className="w-full py-40 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        }>
            <PricingContent {...props} />
        </Suspense>
    )
}
