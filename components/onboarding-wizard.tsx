"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowRight, Check, ChevronLeft, Building2, MapPin, ReceiptText, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

function normalizeIndianMobile(input: string): string {
    let value = input.replace(/\D/g, "")
    if (value.startsWith("91") && value.length > 10) value = value.slice(2)
    if (value.startsWith("0")) value = value.slice(1)
    return value.slice(0, 10)
}

function normalizePincode(input: string): string {
    return input.replace(/\D/g, "").slice(0, 6)
}

function compactSpaces(input: string): string {
    return input.trim().replace(/\s+/g, " ")
}

const STATE_PINCODE_RULES: Record<string, RegExp> = {
    "Andhra Pradesh": /^(51|52|53)\d{4}$/,
    "Arunachal Pradesh": /^79\d{4}$/,
    "Assam": /^78\d{4}$/,
    "Bihar": /^(80|81|82|83|84|85)\d{4}$/,
    "Chhattisgarh": /^49\d{4}$/,
    "Goa": /^40\d{4}$/,
    "Gujarat": /^(36|37|38|39)\d{4}$/,
    "Haryana": /^(12|13)\d{4}$/,
    "Himachal Pradesh": /^17\d{4}$/,
    "Jharkhand": /^(81|82|83)\d{4}$/,
    "Karnataka": /^(56|57|58|59)\d{4}$/,
    "Kerala": /^(67|68|69)\d{4}$/,
    "Madhya Pradesh": /^(45|46|47|48)\d{4}$/,
    "Maharashtra": /^(40|41|42|43|44)\d{4}$/,
    "Manipur": /^79\d{4}$/,
    "Meghalaya": /^79\d{4}$/,
    "Mizoram": /^79\d{4}$/,
    "Nagaland": /^79\d{4}$/,
    "Odisha": /^(75|76|77)\d{4}$/,
    "Punjab": /^(14|15|16)\d{4}$/,
    "Rajasthan": /^(30|31|32|33|34)\d{4}$/,
    "Sikkim": /^73\d{4}$/,
    "Tamil Nadu": /^(60|61|62|63|64)\d{4}$/,
    "Telangana": /^50\d{4}$/,
    "Tripura": /^79\d{4}$/,
    "Uttar Pradesh": /^(20|21|22|23|24|25|26|27|28)\d{4}$/,
    "Uttarakhand": /^(24|26)\d{4}$/,
    "West Bengal": /^(70|71|72|73|74)\d{4}$/,
    "Andaman and Nicobar Islands": /^74\d{4}$/,
    "Chandigarh": /^16\d{4}$/,
    "Dadra and Nagar Haveli and Daman and Diu": /^39\d{4}$/,
    "Delhi": /^11\d{4}$/,
    "Jammu and Kashmir": /^(18|19)\d{4}$/,
    "Ladakh": /^19\d{4}$/,
    "Lakshadweep": /^68\d{4}$/,
    "Puducherry": /^(53|60|67)\d{4}$/,
}

function isPincodeValidForState(state: string, pincode: string): boolean {
    const rule = STATE_PINCODE_RULES[state]
    if (!rule) return true
    return rule.test(pincode)
}

const organizationSchema = z.object({
    userName: z.string()
        .trim()
        .min(2, "Please enter your full name")
        .max(50, "Name is too long")
        .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, dots, and hyphens")
        .refine((val: string) => compactSpaces(val).length >= 2, "Please enter your full name"),
    name: z.string()
        .trim()
        .min(3, "Business name must be at least 3 characters")
        .max(100, "Business name is too long")
        .regex(/[a-zA-Z0-9]{3,}/, "Business name must contain at least 3 alphanumeric characters")
        .refine((val: string) => val.toLowerCase() !== "demo", {
            message: "The name 'demo' is reserved. Please choose another name."
        })
        .refine((val: string) => !/^\d+$/.test(val.trim()), {
            message: "Business name cannot be only numbers."
        }),
    gstin: z.string()
        .trim()
        .toUpperCase()
        .optional()
        .refine((val) => !val || val === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val), {
            message: "Invalid GSTIN format. Must be 15 characters (e.g. 22AAAAA0000A1Z5)."
        }),
    // Detailed Address Fields
    address_line1: z.string()
        .trim()
        .min(3, "Street/Building is required")
        .max(200, "Address is too long"),
    locality: z.string().trim().max(100, "Locality is too long").optional(),
    city: z.string()
        .trim()
        .min(2, "City is required")
        .max(50, "City name is too long")
        .regex(/^[a-zA-Z\s'-]+$/, "City can only contain letters"),
    state: z.string()
        .trim()
        .min(2, "State is required")
        .max(50, "State name is too long")
        .regex(/^[a-zA-Z\s]+$/, "State can only contain letters"),
    pincode: z.string()
        .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number (starting with 6-9)"),
}).superRefine((data, ctx) => {
    if (data.state && data.pincode && /^\d{6}$/.test(data.pincode) && !isPincodeValidForState(data.state, data.pincode)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pincode"],
            message: `Pincode does not match selected state (${data.state}).`,
        })
    }
})

type OrganizationFormValues = z.infer<typeof organizationSchema>
type NameAvailabilityState = "idle" | "checking" | "available" | "taken" | "error"

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 2200): Promise<Response> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        })
    } finally {
        window.clearTimeout(timer)
    }
}

async function postOrganization(payload: Record<string, unknown>): Promise<Response> {
    const requestInit: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
    }

    try {
        return await fetch("/api/organizations", requestInit)
    } catch {
        // Retry once with absolute URL to survive occasional relative-path/proxy hiccups.
        const absoluteUrl = `${window.location.origin}/api/organizations`
        await new Promise((resolve) => window.setTimeout(resolve, 600))
        return fetch(absoluteUrl, requestInit)
    }
}

async function waitForOrganizationReady(slug: string, attempts = 12, delayMs = 400): Promise<boolean> {
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await fetchWithTimeout("/api/organizations", { cache: "no-store" })
            if (res.ok) {
                const list = await res.json().catch(() => [] as any[])
                if (Array.isArray(list)) {
                    const exists = list.some((item: any) => item?.organization?.slug === slug || item?.slug === slug)
                    if (exists) return true
                }
            }
        } catch {
            // swallow and retry
        }
        await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }
    return false
}

function hardRedirectToDashboard(slug: string): void {
    const targetPath = `/${slug}/dashboard`
    const url = `${targetPath}?fresh=${Date.now()}`
    window.location.assign(url)
    // If browser/router ignores the first navigation for any reason, force again.
    window.setTimeout(() => {
        if (window.location.pathname.includes("/setup-organization")) {
            window.location.replace(url)
        }
    }, 900)
}

export function OnboardingWizard({ userId, profile }: { userId: string, profile?: any }) {
    // We will now always show 4 steps to ensure Name and Phone are captured/confirmed
    const [step, setStep] = useState(1)
    const totalSteps = 4
    const [loading, setLoading] = useState(false)
    const [nameAvailability, setNameAvailability] = useState<NameAvailabilityState>("idle")
    const draftStorageKey = useMemo(() => `onboarding-draft:${userId}`, [userId])

    const {
        register,
        handleSubmit,
        trigger,
        setValue,
        watch,
        reset,
        setError,
        clearErrors,
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

    const watchedUserName = watch("userName")
    const watchedPhone = watch("phone")
    const watchedBusinessName = watch("name")
    const watchedState = watch("state")

    const isUserNameValid = !!watchedUserName && compactSpaces(watchedUserName).length >= 2 && !errors.userName
    const isPhoneValid = /^[6-9]\d{9}$/.test(normalizeIndianMobile(watchedPhone || "")) && !errors.phone
    const isBusinessNameValid = !!watchedBusinessName && compactSpaces(watchedBusinessName).length >= 3 && !errors.name

    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const raw = window.sessionStorage.getItem(draftStorageKey)
            if (!raw) return
            const draft = JSON.parse(raw) as Partial<OrganizationFormValues>
            reset({
                userName: draft.userName ?? profile?.name ?? "",
                name: draft.name ?? "",
                gstin: draft.gstin ?? "",
                address_line1: draft.address_line1 ?? "",
                locality: draft.locality ?? "",
                city: draft.city ?? "",
                state: draft.state ?? "",
                pincode: draft.pincode ?? "",
                phone: draft.phone ?? "",
            })
        } catch {
            // Ignore corrupted draft values.
        }
    }, [draftStorageKey, profile?.name, reset])

    useEffect(() => {
        if (typeof window === "undefined") return
        const subscription = watch((values: Partial<OrganizationFormValues>) => {
            window.sessionStorage.setItem(draftStorageKey, JSON.stringify(values))
        })
        return () => subscription.unsubscribe()
    }, [draftStorageKey, watch])

    useEffect(() => {
        if (step !== 2) return
        const candidate = compactSpaces(watchedBusinessName || "")

        if (candidate.length < 3) {
            setNameAvailability("idle")
            clearErrors("name")
            return
        }

        const controller = new AbortController()
        setNameAvailability("checking")

        const timer = window.setTimeout(async () => {
            try {
                const res = await fetch(`/api/organizations/name-availability?name=${encodeURIComponent(candidate)}`, {
                    signal: controller.signal,
                    cache: "no-store",
                })
                const data = await res.json().catch(() => ({} as any))
                if (!res.ok) throw new Error(data?.error || "Failed to check name availability")

                if (data?.available) {
                    setNameAvailability("available")
                    clearErrors("name")
                } else {
                    setNameAvailability("taken")
                    setError("name", {
                        type: "manual",
                        message: "This organization name is already taken. Try a different one.",
                    })
                }
            } catch (err: any) {
                if (err?.name === "AbortError") return
                setNameAvailability("error")
            }
        }, 350)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [step, watchedBusinessName, setError, clearErrors])

    const nextStep = async () => {
        if (step >= totalSteps) return
        if (step === 2 && nameAvailability === "taken") {
            toast.error("Business name is already taken. Please choose another.")
            return
        }
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
        if (loading) return
        setLoading(true)
        try {
            const resp = await postOrganization({
                name: data.name,
                userId,
                userName: data.userName,
                gstin: data.gstin,
                address: `${data.address_line1}${data.locality ? `, ${data.locality}` : ""}, ${data.city}, ${data.state} - ${data.pincode}`,
                phone: data.phone
            })

            const org = await resp.json().catch(() => ({} as any))

            if (!resp.ok || !org || !org.slug) {
                console.error('Create org failed', org)
                throw new Error(org?.error || 'Failed to create organization')
            }

            toast.success("Organization created successfully! Initializing your dashboard...")
            window.sessionStorage.removeItem(draftStorageKey)

            // Redirect to org-specific dashboard path
            const ready = await waitForOrganizationReady(org.slug)
            if (!ready) {
                toast.message("Finalizing workspace. Redirecting now...")
            }
            hardRedirectToDashboard(org.slug)
        } catch (error: any) {
            const message = error?.message || "Failed to create organization"
            const isNetworkError =
                error instanceof TypeError ||
                /networkerror|failed to fetch|network request failed/i.test(message)

            if (isNetworkError) {
                toast.error("Network issue while creating organization. Please retry once.")
            } else {
                if (/already exists/i.test(message)) {
                    setStep(2)
                    setNameAvailability("taken")
                    setError("name", {
                        type: "manual",
                        message: "Name unavailable. Try adding your area or brand variant (e.g. TEST123 GUWAHATI).",
                    })
                    toast.error("Organization name already exists. Please choose a unique name.")
                } else {
                    console.error("Failed to create organization", error)
                    toast.error(message)
                }
            }
        } finally {
            setLoading(false)
        }
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
                <h1
                    className="text-5xl font-black tracking-tighter text-zinc-950 dark:text-white mb-1 animate-in fade-in slide-up"
                >
                    Khata<span className="text-primary italic">Plus</span>
                </h1>
            </div>

            {/* Dynamic Progress Indicator */}
            <div className="mb-8 relative px-4">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-500 ease-in-out"
                        style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                    />
                </div>
                <div className="relative flex justify-between">
                    {Array.from({ length: totalSteps }).map((_, i) => {
                        const s = i + 1;
                        let label = "";
                        label = s === 1 ? "Owner" : s === 2 ? "Brand" : s === 3 ? "Tax" : "Office";

                        return (
                            <div key={s} className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10 transition-all duration-300",
                                        s < step ? "bg-primary text-white" : s === step ? "bg-primary text-white ring-4 ring-primary/20 scale-110" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                                    )}
                                >
                                    {s < step ? <Check size={14} /> : s}
                                </div>
                                <span className={`mt-2 text-[9px] uppercase tracking-widest font-bold ${s === step ? "text-primary" : "text-zinc-400"}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form Steps */}
            <form className="relative min-h-[400px]" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Step 1: Owner Details (Name & Phone) */}
                {step === 1 && (
                    <div
                        key="step1"
                        className="animate-in fade-in slide-in-from-right-4 duration-400"
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
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="userName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Full Name</Label>
                                        <span className="text-[10px] font-bold text-zinc-400">{watchedUserName?.length || 0}/50</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="userName"
                                            placeholder="e.g. John Doe"
                                            {...register("userName")}
                                            className="h-14 text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all rounded-xl px-4"
                                            autoFocus
                                        />
                                        {isUserNameValid && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <Check size={18} />
                                            </div>
                                        )}
                                    </div>
                                    {errors.userName && (
                                        <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.userName.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Mobile Number</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black border-r-2 border-zinc-200 dark:border-zinc-700 pr-3 h-6 flex items-center text-base z-10">
                                            +91
                                        </div>
                                        <Input
                                            id="phone"
                                            placeholder="10-digit number"
                                            {...register("phone")}
                                            maxLength={10}
                                            inputMode="numeric"
                                            pattern="[6-9][0-9]{9}"
                                            className="h-14 pl-16 text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-xl transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 pr-10"
                                            onChange={(e) => setValue("phone", normalizeIndianMobile(e.target.value), { shouldValidate: true })}
                                            onKeyDown={(e) => {
                                                if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)) return;
                                                if (!/[0-9]/.test(e.key)) e.preventDefault();
                                            }}
                                        />
                                        {isPhoneValid && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <Check size={18} />
                                            </div>
                                        )}
                                    </div>
                                    {errors.phone && (
                                        <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                <Button type="button" onClick={nextStep} className="w-full h-14 text-lg font-black bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all rounded-xl active:scale-95" size="lg">
                                    Next Step <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: Business Brand */}
                {step === 2 && (
                    <div
                        key="step2"
                        className="animate-in fade-in slide-in-from-right-4 duration-400"
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
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Business Name</Label>
                                        <span className="text-[10px] font-bold text-zinc-400">{watchedBusinessName?.length || 0}/100</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="name"
                                            placeholder="e.g. PLATINUM ELECTRONICS"
                                            {...register("name", {
                                                onChange: (e) => {
                                                    e.target.value = e.target.value.toUpperCase();
                                                }
                                            })}
                                            className="h-14 text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl px-4 uppercase pr-10"
                                            autoFocus
                                        />
                                        {nameAvailability === "checking" ? (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                                <Loader2 size={18} className="animate-spin" />
                                            </div>
                                        ) : isBusinessNameValid && nameAvailability !== "taken" && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <Check size={18} />
                                            </div>
                                        )}
                                    </div>
                                    {nameAvailability === "available" && !errors.name && (
                                        <p className="text-[11px] text-emerald-600 font-black uppercase tracking-wider">Name available</p>
                                    )}
                                    {nameAvailability === "taken" && (
                                        <p className="text-[11px] text-red-600 font-black uppercase tracking-wider">Name not available</p>
                                    )}
                                    {errors.name && (
                                        <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 font-black text-base border-2 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 transition-all shadow-md">
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={nameAvailability === "checking" || nameAvailability === "taken"}
                                        className="flex-[2] h-14 text-lg font-black shadow-xl transition-all rounded-xl active:scale-95 bg-primary hover:bg-primary/90 text-white disabled:opacity-60"
                                        size="lg"
                                    >
                                        Continue <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Tax Presence (GSTIN) */}
                {step === 3 && (
                    <div
                        key="step3"
                        className="animate-in fade-in slide-in-from-right-4 duration-400"
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
                                        maxLength={15}
                                        className="h-14 font-mono tracking-widest text-lg bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-xl px-4 uppercase"
                                        autoFocus
                                    />
                                    {errors.gstin && (
                                        <p className="text-xs text-red-600 font-black flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-600" /> {errors.gstin.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 font-black text-base border-2 rounded-xl bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 transition-all shadow-md">
                                        Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-[2] h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 text-white rounded-xl active:scale-95" size="lg">
                                        Next Step <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 4: Office Address */}
                {step === 4 && (
                    <div
                        key="step4"
                        className="animate-in fade-in slide-in-from-right-4 duration-400"
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
                                            autoComplete="address-line1"
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
                                            autoComplete="address-line2"
                                            className="h-12 font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">City</Label>
                                        <Input
                                            {...register("city")}
                                            placeholder="City"
                                            autoComplete="address-level2"
                                            className="h-12 font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                        />
                                        {errors.city && <p className="text-[9px] text-red-600 font-black">{errors.city.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">State</Label>
                                        <Select
                                            value={watchedState || ""}
                                            onValueChange={(value) => setValue("state", value, { shouldValidate: true, shouldDirty: true })}
                                        >
                                            <SelectTrigger className="h-12 w-full font-bold bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3 text-left">
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INDIAN_STATES.map((stateOption) => (
                                                    <SelectItem key={stateOption} value={stateOption}>
                                                        {stateOption}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input type="hidden" {...register("state")} />
                                        {errors.state && <p className="text-[9px] text-red-600 font-black">{errors.state.message}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pincode</Label>
                                        <Input
                                            {...register("pincode")}
                                            placeholder="000000"
                                            maxLength={6}
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            autoComplete="postal-code"
                                            className="h-12 font-mono font-bold tracking-widest bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-lg px-3"
                                            onChange={(e) => setValue("pincode", normalizePincode(e.target.value), { shouldValidate: true })}
                                            onKeyDown={(e) => {
                                                if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)) return;
                                                if (!/[0-9]/.test(e.key)) e.preventDefault();
                                            }}
                                        />
                                        {errors.pincode && <p className="text-[9px] text-red-600 font-black">{errors.pincode.message}</p>}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-8 w-full">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={prevStep}
                                        className="flex-none w-24 sm:w-28 h-14 text-base sm:text-lg font-black rounded-xl"
                                        disabled={loading}
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 min-w-0 h-14 text-base sm:text-lg font-black rounded-xl bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Activating...
                                            </span>
                                        ) : (
                                            <span className="truncate">
                                                Activate Account <Check className="ml-2 h-5 w-5 inline" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </form>

            {/* Subtle Footer */}
            <p
                className="mt-6 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-in fade-in duration-700 delay-500"
            >
                Secure Cloud Infrastructure &bull; End-to-End Encryption
            </p>
        </div >
    )
}

