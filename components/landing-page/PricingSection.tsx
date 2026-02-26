"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, Sparkles, Zap, Shield, Crown, Building2 } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { toast } from "sonner"
import type { BillingPlanKey } from "@/lib/billing-plans"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
    planKey: BillingPlanKey
    name: string
    icon: any
    price: { monthly: number; yearly: number }
    desc: string
    features: string[]
    cta: string
    color: string
    popular?: boolean
}

const tiers: PricingTier[] = [
    {
        planKey: "keep",
        name: "Keep",
        icon: Shield,
        price: { monthly: 49, yearly: 399 },
        desc: "Essential data safety.",
        features: [
            "Data preserved & safe",
            "10 Billing / Month",
            "30 Stock items",
            "Digital Khata Ledger",
            "WhatsApp Sharing"
        ],
        cta: "Start Free",
        color: "zinc"
    },
    {
        planKey: "starter",
        name: "Starter",
        icon: Zap,
        price: { monthly: 179, yearly: 1499 },
        desc: "For small retail shops.",
        features: [
            "Unlimited Billing",
            "200 Stock Items",
            "3 Staff Member Seats",
            "A4 + Thermal Printing",
            "Daily Profit Reports"
        ],
        cta: "Scale Up",
        color: "blue"
    },
    {
        planKey: "pro",
        name: "Pro",
        icon: Crown,
        price: { monthly: 449, yearly: 3999 },
        desc: "For growing retailers.",
        features: [
            "Unlimited Stock",
            "Advanced Analytics",
            "GST Sync Ready",
            "Works fully Offline",
            "3 Store Locations"
        ],
        cta: "Go Pro",
        popular: true,
        color: "emerald"
    },
    {
        planKey: "business",
        name: "Business",
        icon: Building2,
        price: { monthly: 899, yearly: 7999 },
        desc: "For large store chains.",
        features: [
            "Unlimited Staff",
            "WhatsApp Automation",
            "Advanced GST Filing",
            "AI Stock Forecasting",
            "Audit & Activity Logs"
        ],
        cta: "Enquire",
        color: "indigo"
    }
]


function PricingContent({
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
    const [showEnquiry, setShowEnquiry] = useState(false)
    const [enquirySubmitting, setEnquirySubmitting] = useState(false)
    const [enquiry, setEnquiry] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: ""
    })

    useEffect(() => {
        const payment = searchParams.get("payment")
        if (!payment || paymentToastShown) return
        const message = searchParams.get("message")
        if (payment === "success") toast.success(message || "Payment successful. Plan activated.")
        else if (payment === "failed") toast.error(message || "Payment verification failed.")
        setPaymentToastShown(true)
    }, [searchParams, paymentToastShown])

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

    const handleEnquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setEnquirySubmitting(true)
        try {
            const response = await fetch("/api/enquiry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...enquiry,
                    plan: "business",
                    cycle: billingCycle,
                    source: "pricing"
                })
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) throw new Error(data?.error || "Failed to send enquiry")
            toast.success("Enquiry sent. We'll reach out shortly.")
            setShowEnquiry(false)
            setEnquiry({ name: "", email: "", phone: "", company: "", message: "" })
        } catch (error: any) {
            toast.error(error?.message || "Failed to send enquiry")
        } finally {
            setEnquirySubmitting(false)
        }
    }

    return (
        <section id="pricing" className="py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-6 mb-16">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/50">
                                <Sparkles size={12} className="text-zinc-600" />
                                <span className="text-zinc-600 font-black text-[9px] tracking-widest uppercase text-zinc-400">Pricing Models</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 leading-none italic uppercase">
                                Simple. <span className="text-zinc-400">Scalable.</span>
                            </h2>
                            <p className="text-zinc-500 text-base font-medium max-w-lg mx-auto">
                                Transparent plans that grow with your business scale.
                            </p>
                        </div>
                    </AdvancedScrollReveal>

                    <div className="flex items-center justify-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={cn(
                                "px-6 py-2 rounded-lg transition-all duration-500 font-black text-[10px] uppercase tracking-widest",
                                billingCycle === "monthly" ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={cn(
                                "px-6 py-2 rounded-lg transition-all duration-500 font-black text-[10px] uppercase tracking-widest relative",
                                billingCycle === "yearly" ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500"
                            )}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded-full italic">Save 25%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {tiers.map((tier, i) => (
                        <AdvancedScrollReveal key={tier.planKey} variant="slideUp" delay={i * 50}>
                            <div className={cn(
                                "group relative h-full flex flex-col p-6 rounded-[2rem] border transition-all duration-500",
                                tier.popular
                                    ? "bg-zinc-950 border-zinc-900 shadow-2xl z-10"
                                    : "bg-white border-zinc-100 hover:bg-zinc-50"
                            )}>
                                {tier.popular && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-500 text-zinc-950 font-black text-[8px] px-3 py-0.5 rounded-full uppercase italic">
                                        Popular
                                    </div>
                                )}

                                <div className="space-y-4 mb-8">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        tier.popular ? "bg-white/10 text-emerald-400" : "bg-zinc-100 text-zinc-600"
                                    )}>
                                        <tier.icon size={22} />
                                    </div>
                                    <div>
                                        <h3 className={cn("text-xl font-black italic tracking-tighter uppercase", tier.popular ? "text-white" : "text-zinc-900")}>{tier.name}</h3>
                                        <p className={cn("text-[11px] font-medium leading-relaxed", tier.popular ? "text-zinc-500" : "text-zinc-400")}>{tier.desc}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    {tier.planKey === "business" ? (
                                        <div className="flex flex-col gap-1">
                                            <span className={cn("text-3xl font-black italic tracking-tighter", tier.popular ? "text-white" : "text-zinc-900")}>
                                                Contact
                                            </span>
                                            <div className="text-emerald-500 font-bold text-[8px] uppercase tracking-widest">
                                                For Enterprise Volume
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className={cn("text-3xl font-black italic tracking-tighter", tier.popular ? "text-white" : "text-zinc-900")}>
                                                    {formatINR(tier.price[billingCycle])}
                                                </span>
                                                <span className="text-zinc-500 font-bold text-[8px] uppercase tracking-widest">
                                                    /{billingCycle === "yearly" ? "yr" : "mo"}
                                                </span>
                                            </div>
                                            {billingCycle === "yearly" && (
                                                <div className="text-emerald-500 font-bold text-[8px] uppercase tracking-widest mt-1">
                                                    {formatINR(Math.floor(tier.price.yearly / 12))}/mo
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-3 mb-8 flex-1 pt-6 border-t border-white/5">
                                    {tier.features.map((feat, j) => (
                                        <div key={j} className="flex items-center gap-2.5">
                                            <Check size={12} className={tier.popular ? "text-emerald-400" : "text-zinc-400"} />
                                            <span className={cn("text-xs font-medium transition-colors", tier.popular ? "text-zinc-400" : "text-zinc-500")}>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        if (tier.planKey === "keep") {
                                            handleStartTrial()
                                            return
                                        }
                                        if (tier.planKey === "business") {
                                            setShowEnquiry(true)
                                            return
                                        }
                                        handleCheckout(tier.planKey)
                                    }}
                                    disabled={loadingPlanKey !== null}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                        tier.popular
                                            ? "bg-white text-zinc-950 hover:bg-emerald-400"
                                            : "bg-zinc-950 text-white hover:bg-emerald-600 shadow-xl"
                                    )}
                                >
                                    {loadingPlanKey === tier.planKey ? "..." : tier.cta}
                                </button>
                            </div>
                        </AdvancedScrollReveal>
                    ))}
                </div>
            </div>

            <Dialog open={showEnquiry} onOpenChange={setShowEnquiry}>
                <DialogContent className="max-w-lg rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Business Plan Enquiry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEnquirySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                required
                                value={enquiry.name}
                                onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })}
                                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium"
                                placeholder="Full name"
                            />
                            <input
                                required
                                type="email"
                                value={enquiry.email}
                                onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium"
                                placeholder="Work email"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                required
                                value={enquiry.phone}
                                onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })}
                                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium"
                                placeholder="Phone"
                            />
                            <input
                                value={enquiry.company}
                                onChange={(e) => setEnquiry({ ...enquiry, company: e.target.value })}
                                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium"
                                placeholder="Company"
                            />
                        </div>
                        <textarea
                            value={enquiry.message}
                            onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })}
                            className="w-full min-h-[110px] rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium"
                            placeholder="Tell us about your needs"
                        />
                        <button
                            type="submit"
                            disabled={enquirySubmitting}
                            className="w-full rounded-xl bg-zinc-950 text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-60"
                        >
                            {enquirySubmitting ? "Sending..." : "Send Enquiry"}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
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
