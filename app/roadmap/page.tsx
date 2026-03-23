"use client"

import Link from "next/link"
import { useState } from "react"
import { Calendar, CheckCircle2, Clock, MessageSquarePlus, Shield, Sparkles, X, Zap } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { Navbar } from "@/components/landing-page/Navbar"
import { SiteFooter } from "@/components/landing-page/SiteFooter"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const roadmapData = [
    {
        phase: "Phase 1",
        status: "Completed",
        title: "Core operations are locked in",
        description: "The essential billing, khata, stock, and sync systems are already in place so shops can run day-to-day work without friction.",
        icon: Shield,
        items: [
            { title: "Simplified GST billing", completed: true },
            { title: "Offline-first engine", completed: true },
            { title: "Digital khata ledger", completed: true },
            { title: "Inventory management", completed: true },
            { title: "Real-time sync", completed: true }
        ],
        tone: "from-emerald-300 via-cyan-200 to-white",
        iconBg: "bg-emerald-300",
        iconColor: "text-emerald-900"
    }
]

export default function RoadmapPage() {
    const [requestOpen, setRequestOpen] = useState(false)
    const [featureTitle, setFeatureTitle] = useState("")
    const [featureDetails, setFeatureDetails] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [submittingRequest, setSubmittingRequest] = useState(false)

    const handleFeatureRequest = () => {
        const submit = async () => {
            if (!featureTitle.trim() || !featureDetails.trim()) return

            setSubmittingRequest(true)

            try {
                const response = await fetch("/api/roadmap/feature-request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        page: "roadmap",
                        title: featureTitle.trim(),
                        details: featureDetails.trim(),
                        contactEmail: contactEmail.trim(),
                    }),
                })

                const data = await response.json().catch(() => ({}))
                if (!response.ok) {
                    throw new Error(data?.error || "Failed to submit feature request.")
                }

                toast.success("Feature request submitted.")
                setFeatureTitle("")
                setFeatureDetails("")
                setContactEmail("")
                setRequestOpen(false)
            } catch (error: any) {
                toast.error(error?.message || "Failed to submit feature request.")
            } finally {
                setSubmittingRequest(false)
            }
        }

        void submit()
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.34),transparent_26%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.16),transparent_24%),linear-gradient(180deg,#d8efe2_0%,#e0ecfb_34%,#dde8fb_70%,#d8e5f8_100%)] text-zinc-900">
            <Navbar
                isAuthenticated={false}
                isLight={true}
                forcePublicActions={true}
            />

            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="overflow-hidden border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,252,255,0.97))] p-0 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.35)] sm:max-w-[620px]">
                    <div className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.22),transparent_36%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.92))] px-8 py-7">
                        <div className="flex items-start justify-between gap-4">
                            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                <MessageSquarePlus size={14} />
                                Feature Request
                            </div>
                            <button
                                type="button"
                                onClick={() => setRequestOpen(false)}
                                aria-label="Close feature request dialog"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <DialogHeader className="mt-4 space-y-2 text-left">
                            <DialogTitle className="text-2xl font-black tracking-tight text-zinc-950">Request a feature</DialogTitle>
                            <DialogDescription className="max-w-xl text-sm leading-relaxed text-zinc-600">
                                Tell us what feature you want in KhataPlus.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.11),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(249,251,255,0.92))] px-8 py-6">
                        <div className="grid gap-4 py-1">
                            <div className="space-y-2">
                                <Label htmlFor="feature-title" className="text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">Feature title</Label>
                                <Input
                                    id="feature-title"
                                    value={featureTitle}
                                    onChange={(e) => setFeatureTitle(e.target.value)}
                                    placeholder="Supplier payment reminders"
                                    className="h-12 rounded-2xl border-zinc-200 !bg-white px-4 !text-zinc-900 caret-zinc-900 shadow-[0_1px_0_rgba(255,255,255,0.9)] placeholder:!text-zinc-400 focus-visible:ring-emerald-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="feature-details" className="text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">What should it do?</Label>
                                <Textarea
                                    id="feature-details"
                                    value={featureDetails}
                                    onChange={(e) => setFeatureDetails(e.target.value)}
                                    placeholder="Describe the problem, when it comes up, and what the ideal workflow should feel like."
                                    className="min-h-[140px] rounded-2xl border-zinc-200 !bg-white px-4 py-3 !text-zinc-900 caret-zinc-900 shadow-[0_1px_0_rgba(255,255,255,0.9)] placeholder:!text-zinc-400 focus-visible:ring-emerald-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact-email" className="text-[12px] font-black uppercase tracking-[0.14em] text-zinc-500">Contact email (optional)</Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="h-12 rounded-2xl border-zinc-200 !bg-white px-4 !text-zinc-900 caret-zinc-900 shadow-[0_1px_0_rgba(255,255,255,0.9)] placeholder:!text-zinc-400 focus-visible:ring-emerald-200"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6 gap-3 sm:justify-end">
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl border-zinc-300 bg-white px-5 !text-zinc-700 hover:bg-zinc-50"
                                    onClick={() => setRequestOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    className="rounded-xl bg-emerald-600 px-5 !text-white shadow-[0_12px_24px_-16px_rgba(16,185,129,0.45)] hover:bg-emerald-700 disabled:opacity-100 disabled:bg-emerald-200 disabled:!text-emerald-700"
                                    onClick={handleFeatureRequest}
                                    disabled={submittingRequest || !featureTitle.trim() || !featureDetails.trim()}
                                >
                                    {submittingRequest ? "Sending..." : "Send request"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <section className="relative overflow-hidden px-6 pb-16 pt-28 md:pb-20 md:pt-36">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-10 -top-16 h-[420px] w-[520px] rounded-full bg-emerald-600/26 blur-[130px]" />
                    <div className="absolute right-0 top-6 h-[360px] w-[480px] rounded-full bg-cyan-600/22 blur-[150px]" />
                    <div className="absolute left-1/3 top-20 h-[260px] w-[260px] rounded-full bg-violet-500/16 blur-[130px]" />
                    <div className="absolute right-1/4 top-40 h-[220px] w-[220px] rounded-full bg-amber-500/12 blur-[110px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="border-b border-emerald-100/80 pb-12 text-center">
                            <div className="mx-auto max-w-5xl space-y-7">
                                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                                    <Calendar size={14} />
                                    Product Roadmap 2026
                                </div>
                                <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[0.94] tracking-tight text-zinc-950 md:text-7xl lg:text-[5.9rem]">
                                    Building the future of
                                    <span className="mt-2 block text-emerald-700">
                                        KhataPlus.
                                    </span>
                                </h1>
                                <p className="mx-auto max-w-4xl text-xl leading-relaxed text-zinc-600 md:text-[2rem] md:leading-[1.5]">
                                    A clear look at what we're building. Our roadmap is shaped by what you need most.
                                </p>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setRequestOpen(true)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.35)] transition hover:bg-zinc-50"
                                    >
                                        <MessageSquarePlus size={16} />
                                        Request a Feature
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AdvancedScrollReveal>
                </div>
            </section>

            <section className="relative px-6 pb-12 md:pb-16">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-16 top-10 h-[260px] w-[260px] bg-emerald-700/16 blur-[120px]" />
                    <div className="absolute right-0 bottom-0 h-[280px] w-[280px] bg-sky-700/14 blur-[120px]" />
                    <div className="absolute left-1/3 top-0 h-[220px] w-[220px] bg-amber-600/10 blur-[110px]" />
                    <div className="absolute right-1/3 top-12 h-[220px] w-[220px] bg-violet-600/10 blur-[120px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl space-y-4">
                    <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Roadmap Timeline</h2>

                    {roadmapData.map((phase, i) => (
                        <AdvancedScrollReveal key={phase.phase} variant="slideUp" delay={i * 60}>
                            <article className={cn(
                                "relative overflow-hidden border border-white/90 bg-gradient-to-br p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.25)] md:p-7",
                                phase.tone,
                                phase.current && "ring-1 ring-sky-300/80"
                            )}>
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_36%)]" />

                                <div className="relative z-10 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 shadow-sm", phase.iconBg, phase.iconColor)}>
                                                <phase.icon size={22} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{phase.phase}</p>
                                                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
                                                    {phase.status === "Completed" ? (
                                                        <CheckCircle2 size={14} className="text-emerald-700" />
                                                    ) : (
                                                        <Clock size={14} className={phase.current ? "text-sky-700" : "text-amber-700"} />
                                                    )}
                                                    <span className={cn(
                                                        phase.status === "Completed" && "text-emerald-800",
                                                        phase.current && "text-sky-800",
                                                        phase.status === "Planned" && "text-amber-800"
                                                    )}>
                                                        {phase.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-3xl font-black tracking-tight text-zinc-900">{phase.title}</h3>
                                            <p className="mt-3 text-[17px] leading-relaxed text-zinc-600">
                                                {phase.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-l border-zinc-300/90 pl-0 md:pl-6">
                                        {phase.items.map((item) => (
                                            <div key={item.title} className="flex items-center gap-3 py-2.5">
                                                {item.completed ? (
                                                    <CheckCircle2 size={16} className="shrink-0 text-emerald-800" />
                                                ) : (
                                                    <div className={cn(
                                                        "h-2.5 w-2.5 shrink-0 rounded-full",
                                                        phase.current ? "bg-sky-700" : "bg-amber-700"
                                                    )} />
                                                )}
                                                <span className={cn(
                                                    "text-[15px] font-semibold",
                                                    item.completed ? "text-zinc-700 line-through decoration-zinc-300" : "text-zinc-900"
                                                )}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        </AdvancedScrollReveal>
                    ))}
                </div>
            </section>

            <section className="px-6 pb-10">
                <div className="mx-auto max-w-4xl border-t border-cyan-200/70 px-2 pt-5 text-center">
                    <p className="text-sm font-semibold text-zinc-600">
                        Timeline is directional. Some roadmap items may shift as we test features and prioritize what stores need most.
                    </p>
                </div>
            </section>

            <SiteFooter />
        </main>
    )
}
