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
    userName: z.string()
        .min(2, "Please enter your full name")
        .max(50, "Name is too long"),
    name: z.string()
        .min(3, "Business name must be at least 3 characters")
        .refine(val => val.toLowerCase() !== "demo", {
            message: "The name 'demo' is reserved. Please choose another name."
        }),
    gstin: z.string().optional(),
    // Detailed Address Fields
    address_line1: z.string().min(3, "Street/Building is required"),
    locality: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Valid Pincode required").max(10),
    phone: z.string()
        .min(10, "A valid 10-digit phone number is required")
        .max(15, "Phone number is too long"),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

export function OnboardingWizard({ userId, profile }: { userId: string, profile?: any }) {
    // We will now always show 4 steps to ensure Name and Phone are captured/confirmed
    const [step, setStep] = useState(1)
    const totalSteps = 4
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    console.log("--- [DEBUG] OnboardingWizard: Profile", profile, "---")

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
            address_line1: "",
            locality: "",
            city: "",
            state: "",
            pincode: "",
            phone: "",
        },
    })

    const nextStep = async () => {
        let isValid = false
        if (step === 1) {
            isValid = await trigger(["userName", "phone"])
        } else if (step === 2) {
            isValid = await trigger("name")
        } else if (step === 3) {
            isValid = await trigger("gstin")
        } else if (step === 4) {
            isValid = await trigger(["address_line1", "city", "state", "pincode"])
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
                    address: `${data.address_line1}${data.locality ? `, ${data.locality}` : ""}, ${data.city}, ${data.state} - ${data.pincode}`,
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
        } catch (error: any) {
            console.error("Failed to create organization", error)
            toast.error(error.message || "Failed to create organization")
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
        <div className="w-full max-w-lg mx-auto p-2 sm:p-4 h-full flex flex-col justify-center">
            {/* Header with high-end typography */}
            {/* Live Mesh Background - FIXED: Add pointer-events-none and -z-10 */}
            <div className="fixed inset-0 -z-10 mesh-gradient opacity-10 dark:opacity-[0.05] pointer-events-none" />

            {/* Moving Blobs for Extra Depth - FIXED: Ensure pointer-events-none */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/15 dark:bg-primary/10 blur-[130px] rounded-full animate-orbit" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 dark:bg-indigo-600/10 blur-[130px] rounded-full animate-orbit-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-emerald-600/10 blur-[110px] rounded-full animate-float" />
            </div>

            <div className="text-center mb-6 relative z-10 animate-float">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black tracking-tighter text-zinc-950 dark:text-white mb-1"
                >
                    Khata<span className="text-primary italic">Plus</span>
                </motion.h1>
            </div>

            {/* Dynamic Progress Indicator */}
            <div className="mb-8 relative px-4">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full overflow-hidden">
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
                        label = s === 1 ? "Owner" : s === 2 ? "Brand" : s === 3 ? "Tax" : "Office";

                        return (
                            <div key={s} className="flex flex-col items-center">
                                <motion.div
                                    animate={{
                                        scale: s === step ? 1.1 : 1,
                                        backgroundColor: s <= step ? "var(--primary)" : "var(--zinc-200)",
                                        color: s <= step ? "white" : "var(--zinc-500)"
                                    }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10 
                                        ${s < step ? "bg-primary" : s === step ? "bg-primary ring-4 ring-primary/20" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"}`}
                                >
                                    {s < step ? <Check size={14} /> : s}
                                </motion.div>
                                <span className={`mt-2 text-[9px] uppercase tracking-widest font-bold ${s === step ? "text-primary" : "text-zinc-400"}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Owner Details (Name & Phone) */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-2 border-zinc-200 dark:border-zinc-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] bg-white dark:bg-zinc-900 overflow-hidden rounded-[1.5rem]">
                            <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-violet-500 to-violet-600" />
                            <CardHeader className="pt-6 px-8">
                                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-violet-500/30 rotate-3">
                                    <User size={24} />
                                </div>
                                <CardTitle className="text-3xl font-black tracking-tight">Personal Identity</CardTitle>
                                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                    Your details are required for professional invoices and communication.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Full Name</Label>
                                        <Input
                                            id="userName"
                                            placeholder="e.g. John Doe"
                                            {...register("userName")}
                                            className="h-14 text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all rounded-xl px-4"
                                            autoFocus
                                        />
                                        {errors.userName && (
                                            <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.userName.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Mobile Number</Label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-4 text-zinc-500 font-black border-r-2 border-zinc-200 dark:border-zinc-700 pr-3 h-6 flex items-center text-base">
                                                +91
                                            </div>
                                            <Input
                                                id="phone"
                                                placeholder="10-digit number"
                                                {...register("phone")}
                                                className="h-14 pl-16 text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-xl transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10"
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.phone.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Button onClick={nextStep} className="w-full h-14 text-lg font-black bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all rounded-xl active:scale-95" size="lg">
                                    Next Step <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step 2: Business Brand */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-2 border-zinc-200 dark:border-zinc-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] bg-white dark:bg-zinc-900 overflow-hidden rounded-[1.5rem]">
                            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary to-primary/80" />
                            <CardHeader className="pt-6 px-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-4 shadow-xl shadow-primary/30 rotate-3">
                                    <Building2 size={24} />
                                </div>
                                <CardTitle className="text-3xl font-black tracking-tight">Business Brand</CardTitle>
                                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                    Define the name that will represent your excellence on every invoice and report.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4 space-y-6">
                                <div className="space-y-4">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Business Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. PLATINUM ELECTRONICS"
                                        {...register("name", {
                                            onChange: (e) => {
                                                e.target.value = e.target.value.toUpperCase();
                                            }
                                        })}
                                        className="h-14 text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl px-4 uppercase"
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button variant="outline" onClick={prevStep} className="flex-1 h-14 font-black text-base border-2 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 transition-all shadow-md">
                                        Back
                                    </Button>
                                    <Button onClick={nextStep} className="flex-[2] h-14 text-lg font-black shadow-xl transition-all rounded-xl active:scale-95 bg-primary hover:bg-primary/90 text-white" size="lg">
                                        Continue <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step 3: Tax Presence (GSTIN) */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-2 border-zinc-200 dark:border-zinc-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] bg-white dark:bg-zinc-900 overflow-hidden rounded-[1.5rem]">
                            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600" />
                            <CardHeader className="pt-6 px-8">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/30 -rotate-3">
                                    <ReceiptText size={24} />
                                </div>
                                <CardTitle className="text-3xl font-black tracking-tight text-indigo-950 dark:text-indigo-50">Tax Presence</CardTitle>
                                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                    Compliance made simple. Add your GSTIN to enable automated tax calculations.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4 space-y-6">
                                <div className="space-y-4">
                                    <Label htmlFor="gstin" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">GSTIN (Optional)</Label>
                                    <Input
                                        id="gstin"
                                        placeholder="e.g. 22AAAAA0000A1Z5"
                                        {...register("gstin")}
                                        className="h-14 font-mono tracking-widest text-lg bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-xl px-4 uppercase"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button variant="outline" onClick={prevStep} className="flex-1 h-14 font-black text-base border-2 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 transition-all shadow-md">
                                        Back
                                    </Button>
                                    <Button onClick={nextStep} className="flex-[2] h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 text-white rounded-xl active:scale-95" size="lg">
                                        Next Step <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step 4: Office Address */}
                {step === 4 && (
                    <motion.div
                        key="step4"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <Card className="border-2 border-zinc-200 dark:border-zinc-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] bg-white dark:bg-zinc-900 overflow-hidden rounded-[1.5rem]">
                            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600" />
                            <CardHeader className="pt-6 px-8">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 rotate-6">
                                    <MapPin size={24} />
                                </div>
                                <CardTitle className="text-3xl font-black tracking-tight text-emerald-950 dark:text-emerald-50">Establish Reach</CardTitle>
                                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                    Finalize your professional profile with your business location.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4 space-y-4">
                                {/* Detailed Address Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Street / Building</Label>
                                        <Input
                                            {...register("address_line1")}
                                            placeholder="Unit, Floor, Building Name"
                                            className="h-12 font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                            autoFocus
                                        />
                                        {errors.address_line1 && <p className="text-[9px] text-red-600 font-black">{errors.address_line1.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Locality (Optional)</Label>
                                        <Input
                                            {...register("locality")}
                                            placeholder="Area, Landmark"
                                            className="h-12 font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">City</Label>
                                        <Input
                                            {...register("city")}
                                            placeholder="City"
                                            className="h-12 font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                        />
                                        {errors.city && <p className="text-[9px] text-red-600 font-black">{errors.city.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">State</Label>
                                        <Input
                                            {...register("state")}
                                            placeholder="State"
                                            className="h-12 font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                        />
                                        {errors.state && <p className="text-[9px] text-red-600 font-black">{errors.state.message}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pincode</Label>
                                        <Input
                                            {...register("pincode")}
                                            placeholder="000000"
                                            className="h-12 font-mono font-bold tracking-widest bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                        />
                                        {errors.pincode && <p className="text-[9px] text-red-600 font-black">{errors.pincode.message}</p>}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" onClick={prevStep} className="flex-1 h-14 font-black text-base border-2 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 transition-all shadow-md" disabled={loading}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit(onSubmit)}
                                        className={`flex-[3] h-14 text-lg font-black shadow-xl transition-all rounded-xl active:scale-95
                                            ${loading ? "bg-zinc-800" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/40 text-white"}`}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Activating...
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
                className="mt-6 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
            >
                Secure Cloud Infrastructure &bull; End-to-End Encryption
            </motion.p>
        </div>
    )
}

