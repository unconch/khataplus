"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowRight, Check, Building2, MapPin, ReceiptText, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const organizationSchema = z.object({
    userName: z.string().min(2, "Please enter your name").optional(),
    name: z.string()
        .min(3, "Organization name must be at least 3 characters")
        .refine(val => val.toLowerCase() !== "demo", {
            message: "The name 'demo' is reserved. Please choose another name."
        }),
    gstin: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

export function OnboardingWizard({ userId, profile }: { userId: string, profile?: any }) {
    const hasExistingName = !!(profile?.name && profile.name !== "Anonymous")
    const [step, setStep] = useState(1)
    const totalSteps = hasExistingName ? 3 : 4
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<OrganizationFormValues>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            userName: profile?.name || "",
            name: "",
            gstin: "",
            address: "",
            phone: "",
        },
    })

    const nextStep = async () => {
        let isValid = false
        if (!hasExistingName && step === 1) {
            isValid = await trigger("userName")
        } else if (hasExistingName && step === 1) {
            isValid = await trigger("name")
        } else if (!hasExistingName && step === 2) {
            isValid = await trigger("name")
        } else {
            isValid = true
        }

        if (isValid) {
            setStep((prev) => prev + 1)
        }
    }

    const prevStep = () => {
        setStep((prev) => prev - 1)
    }

    const onSubmit = async (data: OrganizationFormValues) => {
        setLoading(true)
        console.log("--- [DEBUG] OnboardingWizard: Submitting form data", data, "---")
        try {
            const resp = await fetch('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    userId,
                    userName: data.userName,
                    gstin: data.gstin,
                    address: data.address,
                    phone: data.phone
                }),
            })

            const org = await resp.json()

            if (!resp.ok || !org || !org.slug) {
                console.error('Create org failed', org)
                throw new Error(org?.error || 'Failed to create organization')
            }

            toast.success("Organization created successfully! Initializing your dashboard...")

            // Redirect to org-specific dashboard path
            const targetPath = `/${org.slug}/dashboard`
            console.log("--- [DEBUG] OnboardingWizard: Redirecting to", targetPath, "---")

            // Use a forced delay to ensure the database transaction is fully finalized and cache revalidation propagates
            setTimeout(() => {
                // Using window.location.assign to force a full reload and bypass stale client-side router caches
                window.location.assign(targetPath)
            }, 1000)
        } catch (error) {
            console.error("Failed to create organization", error)
            toast.error("Failed to create organization. Check console for details.")
        } finally {
            setLoading(false)
        }
    }

    const variants = {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.98 },
    }

    return (
        <div className="w-full max-w-lg mx-auto p-4 sm:p-6">
            {/* Header with high-end typography */}
            <div className="text-center mb-10">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-2"
                >
                    Khata<span className="text-primary italic">Plus</span>
                </motion.h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Elevate your business management</p>
            </div>

            {/* Dynamic Progress Indicator */}
            <div className="mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    />
                </div>
                <div className="relative flex justify-between">
                    {Array.from({ length: totalSteps }).map((_, i) => {
                        const s = i + 1;
                        let label = "";
                        if (hasExistingName) {
                            label = s === 1 ? "Brand" : s === 2 ? "Tax" : "Office";
                        } else {
                            label = s === 1 ? "Owner" : s === 2 ? "Brand" : s === 3 ? "Tax" : "Office";
                        }

                        return (
                            <div key={s} className="flex flex-col items-center">
                                <motion.div
                                    animate={{
                                        scale: s === step ? 1.2 : 1,
                                        backgroundColor: s <= step ? "var(--primary)" : "var(--zinc-200)",
                                        color: s <= step ? "white" : "var(--zinc-500)"
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10 
                                        ${s < step ? "bg-primary" : s === step ? "bg-primary ring-4 ring-primary/20" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"}`}
                                >
                                    {s < step ? <Check size={18} /> : s}
                                </motion.div>
                                <span className={`mt-3 text-[10px] uppercase tracking-widest font-bold ${s === step ? "text-primary" : "text-zinc-400"}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* NEW: Step 1 - User Identity (Conditional) */}
                {!hasExistingName && step === 1 && (
                    <motion.div
                        key="step0"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-border/40 shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500/50 via-violet-500 to-violet-500/50" />
                            <CardHeader className="pt-8 px-8">
                                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 text-violet-500 shadow-inner border border-violet-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <User size={28} />
                                </div>
                                <CardTitle className="text-3xl font-black">Personal Identity</CardTitle>
                                <CardDescription className="text-base">
                                    Let's start with you. How should we address the visionary behind this business?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="userName" className="text-sm font-bold uppercase tracking-wider text-zinc-500">Your Full Name</Label>
                                    <Input
                                        id="userName"
                                        placeholder="e.g. John Doe"
                                        {...register("userName")}
                                        className="h-14 text-xl font-medium bg-zinc-50/50 dark:bg-zinc-900/50 border-border/50 focus:ring-violet-500 transition-all shadow-sm"
                                        autoFocus
                                    />
                                    {errors.userName && (
                                        <p className="text-sm text-destructive font-bold flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-destructive" /> {errors.userName.message}
                                        </p>
                                    )}
                                </div>

                                <Button onClick={nextStep} className="w-full h-14 text-lg font-bold bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/20 active:scale-95 transition-all outline-none" size="lg">
                                    Establish Identity <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step: Business Name (Original Step 1, now dynamic) */}
                {step === (hasExistingName ? 1 : 2) && (
                    <motion.div
                        key="step1"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-border/40 shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                            <CardHeader className="pt-8 px-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary shadow-inner border border-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <Building2 size={28} />
                                </div>
                                <CardTitle className="text-3xl font-black">Business Brand</CardTitle>
                                <CardDescription className="text-base">
                                    Define the name that will represent your excellence on every invoice and report.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-zinc-500">Business Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Platinum Electronics"
                                        {...register("name")}
                                        className="h-14 text-xl font-medium bg-zinc-50/50 dark:bg-zinc-900/50 border-border/50 focus:ring-primary focus:border-primary transition-all shadow-sm"
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive font-bold flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-destructive" /> {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    {!hasExistingName && (
                                        <Button variant="ghost" onClick={prevStep} className="flex-1 h-14 font-bold border border-border/50">
                                            Back
                                        </Button>
                                    )}
                                    <Button onClick={nextStep} className={cn("h-14 text-lg font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all", hasExistingName ? "w-full" : "flex-[2]")} size="lg">
                                        Continue <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step: GSTIN (Original Step 2, now dynamic) */}
                {step === (hasExistingName ? 2 : 3) && (
                    <motion.div
                        key="step2"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-border/40 shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500/50 via-indigo-500 to-indigo-500/50" />
                            <CardHeader className="pt-8 px-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500 shadow-inner border border-indigo-500/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <ReceiptText size={28} />
                                </div>
                                <CardTitle className="text-3xl font-black text-indigo-950 dark:text-indigo-50">Tax Presence</CardTitle>
                                <CardDescription className="text-base">
                                    Compliance made simple. Add your GSTIN to enable automated tax calculations.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="gstin" className="text-sm font-bold uppercase tracking-wider text-zinc-500">GSTIN (Optional)</Label>
                                    <Input
                                        id="gstin"
                                        placeholder="e.g. 22AAAAA0000A1Z5"
                                        {...register("gstin")}
                                        className="h-14 font-mono tracking-widest text-lg bg-zinc-50/50 dark:bg-zinc-900/50 border-border/50 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button variant="ghost" onClick={prevStep} className="flex-1 h-14 font-bold border border-border/50">
                                        Back
                                    </Button>
                                    <Button onClick={nextStep} className="flex-[2] h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20" size="lg">
                                        Next <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step: Address/Phone (Original Step 3, now dynamic) */}
                {step === (hasExistingName ? 3 : 4) && (
                    <motion.div
                        key="step3"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-border/40 shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
                            <CardHeader className="pt-8 px-8">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500 shadow-inner border border-emerald-500/20 rotate-6 hover:rotate-0 transition-transform duration-300">
                                    <MapPin size={28} />
                                </div>
                                <CardTitle className="text-3xl font-black text-emerald-950 dark:text-emerald-50">Establish Reach</CardTitle>
                                <CardDescription className="text-base">
                                    Finalize your professional profile with your physical address and contact.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-5">
                                <div className="space-y-3">
                                    <Label htmlFor="address" className="text-sm font-bold uppercase tracking-wider text-zinc-500">Shop Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Full address for bills"
                                        {...register("address")}
                                        className="h-14 bg-zinc-50/50 dark:bg-zinc-900/50 border-border/50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-wider text-zinc-500">Contact Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+91 00000 00000"
                                        {...register("phone")}
                                        className="h-14 bg-zinc-50/50 dark:bg-zinc-900/50 border-border/50"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="ghost" onClick={prevStep} className="flex-1 h-14 font-bold border border-border/50" disabled={loading}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit(onSubmit)}
                                        className={`flex-[2] h-14 text-lg font-bold shadow-2xl transition-all
                                            ${loading ? "bg-zinc-800" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"}`}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Setting Up...
                                            </div>
                                        ) : (
                                            <>
                                                Activate Account <Check className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest"
            >
                Secure Cloud Infrastructure &bull; End-to-End Encryption
            </motion.p>
        </div>
    )
}

