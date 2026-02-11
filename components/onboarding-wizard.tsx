"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js"
import { z } from "zod"
import { Loader2, ArrowRight, Check, Building2, MapPin, ReceiptText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createOrganization } from "@/lib/data/organizations"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const organizationSchema = z.object({
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

export function OnboardingWizard({ userId }: { userId: string }) {
    const [step, setStep] = useState(1)
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
            name: "",
            gstin: "",
            address: "",
            phone: "",
        },
    })

    const nextStep = async () => {
        let isValid = false
        if (step === 1) {
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
        try {
            const org = await createOrganization(data.name, userId, {
                gstin: data.gstin,
                address: data.address,
                phone: data.phone,
            })
            toast.success("Organization created successfully!")

            // Redirect to subdomain
            const protocol = window.location.protocol
            const host = window.location.host // e.g. localhost:3000
            const rootDomain = host.replace(/^(demo\.|www\.)/, '') // remove demo or www if present

            const targetUrl = `${protocol}//${org.slug}.${rootDomain}/dashboard`
            console.log("--- [DEBUG] OnboardingWizard: Redirecting to", targetUrl, "---")
            window.location.href = targetUrl
        } catch (error) {
            console.error("Failed to create organization", error)
            toast.error("Failed to create organization. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const variants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    }

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="mb-8 flex justify-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`h-2 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-primary" : s < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
                            }`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <Building2 size={24} />
                                </div>
                                <CardTitle className="text-2xl">Name your Business</CardTitle>
                                <CardDescription>
                                    What's the name of your shop or company? This will be displayed on your invoices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Organization Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Laxmi General Store"
                                        {...register("name")}
                                        className="h-12 text-lg"
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
                                    )}
                                </div>

                                <Button onClick={nextStep} className="w-full h-12 text-base mt-4" size="lg">
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500">
                                    <ReceiptText size={24} />
                                </div>
                                <CardTitle className="text-2xl">Tax Details (Optional)</CardTitle>
                                <CardDescription>
                                    Do you have a GSTIN? Adding it now helps generate compliant invoices. You can skip this.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gstin">GSTIN</Label>
                                    <Input
                                        id="gstin"
                                        placeholder="e.g. 22AAAAA0000A1Z5"
                                        {...register("gstin")}
                                        className="h-12"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
                                        Back
                                    </Button>
                                    <Button onClick={nextStep} className="flex-1 h-12">
                                        Next <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                                    <MapPin size={24} />
                                </div>
                                <CardTitle className="text-2xl">Location & Contact</CardTitle>
                                <CardDescription>
                                    Add your address and phone number for your customers to see on bills.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Shop Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="e.g. 123 Market Road, Jalukbari"
                                        {...register("address")}
                                        className="h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+91 98765 43210"
                                        {...register("phone")}
                                        className="h-12"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
                                        Back
                                    </Button>
                                    <Button onClick={handleSubmit(onSubmit)} className="flex-1 h-12" disabled={loading}>
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                Complete Setup <Check className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
