"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, ChevronDown, Copy, MousePointerClick, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocsNav } from "./docs-nav-provider"
import { DOC_BY_SLUG, GROUP_LABELS, type DocGroupId } from "./docs-data"

const ARTICLE_ANCHORS = [
    { id: "when-to-use", label: "When to Use This" },
    { id: "workflow", label: "Workflow" },
    { id: "steps", label: "Steps" },
    { id: "example", label: "Real Example" },
    { id: "issues", label: "Common Issues" },
]

const GROUP_WORKFLOWS: Record<DocGroupId, string[]> = {
    "start-here": ["Setup", "Add Product", "Create Sale", "Record Payment", "Verify Reports"],
    "daily-billing": ["Customer", "Invoice", "Stock Update", "Ledger Update", "Reports"],
    "khata-payments": ["Open Ledger", "Select Due", "Record Payment", "Update Balance", "Confirm"],
    inventory: ["Add Item", "Set GST/HSN", "Sell Item", "Stock Adjust", "Low-Stock Review"],
    "gst-reports": ["Validate Product Tax", "Fix Invoice Tax", "Re-run Report", "Export GSTR-1", "Review"],
    "teams-staff": ["Invite User", "Assign Role", "Test Access", "Audit"],
    "admin-data": ["Download Template", "Map Columns", "Import", "Validate Totals"],
    plans: ["Review Limits", "Select Plan", "Upgrade", "Confirm Access"],
    "fix-problems": ["Identify Issue", "Check Source", "Apply Fix", "Rebuild Output", "Validate"],
}

const GROUP_WHY: Record<DocGroupId, string> = {
    "start-here": "A clean setup prevents reporting and stock issues later.",
    "daily-billing": "Clear billing flow keeps dues, stock, and GST totals aligned.",
    "khata-payments": "Consistent payment entries protect customer trust and ledger accuracy.",
    inventory: "Stock mistakes quickly impact billing, cash flow, and reorder decisions.",
    "gst-reports": "Small tax errors create major filing rework at month-end.",
    "teams-staff": "Right access controls prevent accidental data changes.",
    "admin-data": "Safe imports protect historical numbers and future reports.",
    plans: "Plan fit helps your team avoid disruption during growth.",
    "fix-problems": "Root-cause fixes save time and stop repeat mismatches.",
}

const GROUP_REASSURE: Record<DocGroupId, string> = {
    "start-here": "You can adjust setup details later from settings.",
    "daily-billing": "Do not worry, correcting current settings will not break completed invoices.",
    "khata-payments": "You can review and correct entries from the ledger timeline if needed.",
    inventory: "You can always make a stock adjustment entry with a reason note.",
    "gst-reports": "Fixing source values first keeps future exports accurate.",
    "teams-staff": "Role access can be changed any time by an admin.",
    "admin-data": "Start with a small sample import first, then run full data confidently.",
    plans: "Plan changes are visible in billing settings right after update.",
    "fix-problems": "Work one issue at a time and verify before moving to the next fix.",
}

const GROUP_UI_FOCUS: Record<DocGroupId, Array<{ title: string; hint: string }>> = {
    "start-here": [
        { title: "Setup Button Area", hint: "Capture only the profile save section." },
        { title: "First Invoice Panel", hint: "Capture totals and payment mode fields." },
    ],
    "daily-billing": [
        { title: "Customer + Item Row", hint: "Capture customer picker and item lines only." },
        { title: "Payment Mode Block", hint: "Capture mode selector and total due preview." },
    ],
    "khata-payments": [
        { title: "Ledger Balance Strip", hint: "Capture opening balance and latest due." },
        { title: "Record Payment Drawer", hint: "Capture amount, note, and save controls." },
    ],
    inventory: [
        { title: "Stock Edit Area", hint: "Capture current stock and update fields." },
        { title: "Low-Stock List", hint: "Capture rows showing critical inventory only." },
    ],
    "gst-reports": [
        { title: "GST Field Section", hint: "Capture GST percent + HSN fields on item." },
        { title: "GSTR Export Action", hint: "Capture export controls and status message." },
    ],
    "teams-staff": [
        { title: "Role Selector", hint: "Capture role dropdown and save action." },
        { title: "Access Matrix", hint: "Capture permission toggles for staff." },
    ],
    "admin-data": [
        { title: "CSV Mapping Grid", hint: "Capture mapped columns and required fields." },
        { title: "Import Error Table", hint: "Capture only row number and error reason columns." },
    ],
    plans: [
        { title: "Plan Compare Table", hint: "Capture limits row and active plan marker." },
        { title: "Upgrade Confirmation", hint: "Capture payment result and status." },
    ],
    "fix-problems": [
        { title: "Mismatch Row", hint: "Capture source value and expected value side by side." },
        { title: "Sync Status Area", hint: "Capture last sync timestamp and retry action." },
    ],
}

export function DocArticleClient({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false)
    const [copiedGuide, setCopiedGuide] = useState(false)
    const [activeAnchor, setActiveAnchor] = useState(ARTICLE_ANCHORS[0].id)
    const { theme } = useDocsNav()
    const article = useMemo(() => DOC_BY_SLUG[slug], [slug])

    useEffect(() => {
        const sections = ARTICLE_ANCHORS.map((anchor) => document.getElementById(anchor.id)).filter(Boolean) as HTMLElement[]
        if (sections.length === 0) return

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
                if (visible[0]?.target?.id) setActiveAnchor(visible[0].target.id)
            },
            { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4, 0.75] }
        )

        sections.forEach((section) => observer.observe(section))
        return () => observer.disconnect()
    }, [article?.slug])

    if (!article) return null

    const Icon = article.icon
    const workflow = GROUP_WORKFLOWS[article.group]
    const uiFocus = GROUP_UI_FOCUS[article.group]
    const isLight = theme === "light"

    const doCopy = async () => {
        if (!article.copyExample) return
        try {
            await navigator.clipboard.writeText(article.copyExample)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
        } catch {
            setCopied(false)
        }
    }

    const doCopyGuide = async () => {
        try {
            const guideText = article.clickGuide
                .map((step, index) => `${index + 1}. Open ${step.page} (${step.href}) -> click "${step.button}" -> ${step.note}`)
                .join("\n")
            await navigator.clipboard.writeText(guideText)
            setCopiedGuide(true)
            setTimeout(() => setCopiedGuide(false), 1200)
        } catch {
            setCopiedGuide(false)
        }
    }

    return (
        <section className="pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="mb-10 flex items-center gap-2">
                    <Link href="/docs" className={cn("text-[13px] font-medium transition-colors", isLight ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-500 hover:text-zinc-300")}>
                        Docs
                    </Link>
                    <span className={cn(isLight ? "text-zinc-400" : "text-zinc-600")}>/</span>
                    <span className={cn("text-[13px] font-medium", isLight ? "text-zinc-900" : "text-zinc-100")}>{article.title}</span>
                </div>

                <div className="grid gap-16 lg:grid-cols-[1fr_260px]">
                    <article className="min-w-0">
                        <header className={cn("border-b pb-10", isLight ? "border-zinc-200" : "border-zinc-800")}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={cn("rounded-xl border p-3 shadow-sm", isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-[#1e1e1e]")}>
                                    <Icon className={cn("h-6 w-6", isLight ? "text-zinc-700" : "text-zinc-300")} />
                                </div>
                                <div>
                                    <p className={cn("text-[11px] font-semibold uppercase tracking-wider", isLight ? "text-zinc-500" : "text-zinc-400")}>
                                        {GROUP_LABELS[article.group]}
                                    </p>
                                    <h1 className={cn("mt-1 text-3xl font-semibold tracking-tight md:text-5xl", isLight ? "text-zinc-950" : "text-white")}>
                                        {article.title}
                                    </h1>
                                </div>
                            </div>

                            <p className={cn("max-w-2xl text-lg font-normal leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>
                                {article.purpose}
                            </p>

                            <div className={cn("mt-8 flex flex-wrap items-center gap-6 text-[13px]", isLight ? "text-zinc-500" : "text-zinc-500")}>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                                    Updated {article.lastUpdated}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                                    {article.readTime} min read
                                </div>
                            </div>

                            {article.quickActions.length > 0 && (
                                <div className={cn(
                                    "mt-8 rounded-2xl border p-5",
                                    isLight
                                        ? "border-zinc-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
                                        : "border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_24%),linear-gradient(180deg,#1b1b1f_0%,#151519_100%)]"
                                )}>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Buttons You Will Use In The App</p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {article.quickActions.map((action) => (
                                            <div
                                                key={action.label}
                                                className={cn(
                                                    "inline-flex min-w-[220px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_14px_32px_-26px_rgba(0,0,0,0.18)]",
                                                    isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-zinc-900/80 shadow-[0_14px_32px_-26px_rgba(0,0,0,0.9)]"
                                                )}
                                            >
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                                                    <ArrowRight className="h-4 w-4" />
                                                </span>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Quick action</div>
                                                    <div className={cn("mt-1 text-sm font-semibold", isLight ? "text-zinc-900" : "text-zinc-100")}>{action.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {article.clickGuide.length > 0 && (
                                <div className={cn(
                                    "mt-8 rounded-[1.7rem] border p-6",
                                    isLight
                                        ? "border-zinc-200 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_24px_54px_-34px_rgba(15,23,42,0.18)]"
                                        : "border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_26%),linear-gradient(180deg,#1b1b1f_0%,#151519_100%)] shadow-[0_24px_54px_-34px_rgba(0,0,0,0.7)]"
                                )}>
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">What To Click</p>
                                            <h2 className={cn("mt-2 text-xl font-bold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>Follow this exact in-app path</h2>
                                            <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>
                                                Use these as your page and button cues while reading the guide.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={doCopyGuide}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors",
                                                copiedGuide
                                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                                    : "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600 hover:text-white"
                                            )}
                                        >
                                            {copiedGuide ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                            {copiedGuide ? "Copied path" : "Copy path"}
                                        </button>
                                    </div>

                                    <div className="mt-6 grid gap-4">
                                        {article.clickGuide.map((step, index) => (
                                            <div key={`${step.page}-${step.button}`} className={cn(
                                                "rounded-2xl border p-4",
                                                isLight ? "border-zinc-200 bg-white/90" : "border-zinc-800/90 bg-zinc-950/70"
                                            )}>
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-sm font-black text-emerald-300">
                                                            {index + 1}
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <div className={cn(
                                                                    "rounded-xl border px-3 py-2",
                                                                    isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-[#1d1d22]"
                                                                )}>
                                                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Open page</div>
                                                                    <div className={cn("mt-1 text-sm font-semibold", isLight ? "text-zinc-900" : "text-zinc-100")}>{step.page}</div>
                                                                </div>
                                                                <ArrowRight className="hidden h-4 w-4 text-zinc-600 md:block" />
                                                                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-emerald-200 shadow-[0_12px_28px_-20px_rgba(16,185,129,0.65)]">
                                                                    <MousePointerClick className="h-4 w-4 text-emerald-300" />
                                                                    <div>
                                                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300/80">Click button</div>
                                                                        <div className="mt-1 text-sm font-bold">{step.button}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className={cn("text-sm leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>{step.note}</p>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={step.href}
                                                        className={cn(
                                                            "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                                                            isLight
                                                                ? "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:text-zinc-950"
                                                                : "border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-zinc-600 hover:text-white"
                                                        )}
                                                    >
                                                        Open page
                                                        <ArrowRight className="h-4 w-4 text-emerald-400" />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </header>

                        <div className="mt-12 space-y-20">
                            <section id="when-to-use" className="scroll-mt-32">
                                <h2 className={cn("mb-6 text-2xl font-semibold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>When to Use This</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {article.whenToUse.map((item) => (
                                        <div key={item} className={cn(
                                            "group relative rounded-xl border p-5 transition-all",
                                            isLight ? "border-zinc-200 bg-white hover:bg-zinc-50" : "border-zinc-800 bg-[#1e1e1e] hover:bg-[#252525]"
                                        )}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-zinc-300" />
                                                </div>
                                                <p className={cn("text-[15px] leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>{item}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={cn("mt-8 rounded-xl border p-8", isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-[#1e1e1e]")}>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Strategic Value</p>
                                    <p className={cn("max-w-2xl text-base leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>"{GROUP_WHY[article.group]}"</p>
                                </div>
                            </section>

                            <section id="workflow" className="scroll-mt-32">
                                <h2 className={cn("mb-6 text-2xl font-semibold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>Workflow Process</h2>

                                <div className={cn(
                                    "rounded-2xl border p-8 shadow-sm",
                                    isLight
                                        ? "border-zinc-200 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
                                        : "border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_24%),linear-gradient(180deg,#1b1b1f_0%,#151519_100%)]"
                                )}>
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Follow this order</p>
                                            <p className={cn("mt-1 text-sm", isLight ? "text-zinc-600" : "text-zinc-400")}>Treat these like the actual buttons and screens you will move through in the app.</p>
                                        </div>
                                        <div className={cn(
                                            "hidden rounded-full border px-3 py-1.5 text-[11px] font-semibold md:inline-flex",
                                            isLight ? "border-zinc-200 bg-white text-zinc-500" : "border-zinc-800 bg-zinc-900/80 text-zinc-400"
                                        )}>
                                            {workflow.length} steps
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {workflow.map((step, idx) => (
                                            <div key={step} className="flex items-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-medium text-zinc-500 mb-2">Step {idx + 1}</span>
                                                    <span className={cn(
                                                        "rounded-xl border px-4 py-2.5 text-[13px] font-medium shadow-[0_10px_20px_-18px_rgba(15,23,42,0.18)]",
                                                        isLight ? "border-zinc-200 bg-white text-zinc-900" : "border-zinc-700 bg-zinc-900 text-zinc-100 shadow-[0_10px_20px_-18px_rgba(0,0,0,0.9)]"
                                                    )}>
                                                        {step}
                                                    </span>
                                                </div>
                                                {idx < workflow.length - 1 ? (
                                                    <div className="mt-6 flex items-center">
                                                        <div className="h-px w-8 bg-zinc-700" />
                                                        <ChevronDown className="h-3 w-3 text-zinc-500 -rotate-90 -ml-1.5" />
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                    {uiFocus.map((shot) => (
                                        <div key={shot.title} className={cn(
                                            "group rounded-xl border p-6 transition-all",
                                            isLight ? "border-zinc-200 bg-white hover:bg-zinc-50" : "border-zinc-800 bg-[#1e1e1e] hover:bg-[#252525]"
                                        )}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={cn("rounded-lg border p-2", isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-700 bg-zinc-800")}>
                                                    <ScanLine className={cn("h-4 w-4", isLight ? "text-zinc-500 group-hover:text-zinc-800" : "text-zinc-400 group-hover:text-zinc-200")} />
                                                </div>
                                                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                                                    UI Reference
                                                </p>
                                            </div>
                                            <h3 className={cn("text-[15px] font-medium", isLight ? "text-zinc-800" : "text-zinc-200")}>{shot.title}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                                                <span className={cn(isLight ? "text-zinc-600" : "text-zinc-400")}>{shot.hint}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="steps" className="scroll-mt-32">
                                <div className="mb-6">
                                    <h2 className={cn("text-2xl font-semibold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>Detailed Instructions</h2>
                                    <p className={cn("mt-2 text-sm", isLight ? "text-zinc-600" : "text-zinc-400")}>Follow these in order while working inside the app.</p>
                                </div>
                                <div className="space-y-4">
                                    {article.steps.map((step, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "group rounded-xl border p-6 transition-all",
                                                isLight ? "border-zinc-200 bg-white hover:bg-zinc-50" : "border-zinc-800 bg-[#1e1e1e] hover:bg-[#252525]"
                                            )}
                                        >
                                            <div className="flex items-start gap-5">
                                                <div className="mt-0.5 flex-shrink-0 flex items-center justify-center">
                                                    <span className={cn(
                                                        "flex h-7 w-7 items-center justify-center rounded-full border text-[13px] font-medium",
                                                        isLight ? "border-zinc-200 bg-zinc-50 text-zinc-700" : "border-zinc-700 bg-zinc-800 text-zinc-300"
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                        <p className={cn(
                                                            "text-[15px] leading-relaxed transition-colors",
                                                            isLight ? "text-zinc-700 group-hover:text-zinc-950" : "text-zinc-300 group-hover:text-zinc-100"
                                                        )}>
                                                            {step}
                                                        </p>
                                                        <span className={cn(
                                                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                                                            isLight ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-zinc-700 bg-zinc-900/80 text-zinc-400"
                                                        )}>
                                                            Step {index + 1}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-[13px] text-zinc-500">
                                                        Complete this step in the app, then move to the next one.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="example" className="scroll-mt-32">
                                <h2 className={cn("mb-6 text-2xl font-semibold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>Practical Application</h2>
                                <div className={cn("rounded-2xl border p-8 md:p-10", isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-[#1e1e1e]")}>
                                    <div className="max-w-2xl">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Real Scenario</p>
                                        <p className={cn("text-lg font-medium leading-relaxed", isLight ? "text-zinc-800" : "text-zinc-200")}>
                                            "{article.example}"
                                        </p>
                                    </div>

                                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                                        {article.tip && (
                                            <div className={cn("rounded-xl border p-5", isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-700 bg-zinc-800")}>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Pro Tip</p>
                                                <p className={cn("text-sm leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>{article.tip}</p>
                                            </div>
                                        )}
                                        {article.warning && (
                                            <div className={cn("rounded-xl border p-5", isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-700 bg-zinc-800")}>
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Important Check</p>
                                                <p className={cn("text-sm leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>{article.warning}</p>
                                            </div>
                                        )}
                                    </div>

                                    {article.copyExample && (
                                        <div className={cn("mt-8 overflow-hidden rounded-xl border shadow-xl", isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-zinc-950")}>
                                            <div className={cn("flex items-center justify-between border-b px-4 py-3", isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-[#1e1e1e]")}>
                                                <div className="flex gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={doCopy}
                                                    className={cn(
                                                        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all border",
                                                        copied
                                                            ? (isLight ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "bg-zinc-700 text-white border-zinc-600")
                                                            : (isLight ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-950 hover:bg-zinc-50" : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border-zinc-700")
                                                    )}
                                                >
                                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    {copied ? "Copied" : "Copy snippet"}
                                                </button>
                                            </div>
                                            <div className={cn("overflow-x-auto p-5", isLight ? "bg-zinc-50" : "bg-[#1a1a1a]")}>
                                                <pre className={cn("text-[13px] font-mono leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>
                                                    <code>{article.copyExample}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section id="issues" className="scroll-mt-32">
                                <h2 className={cn("mb-6 text-2xl font-semibold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>Common Gotchas</h2>
                                <div className="space-y-3">
                                    {article.commonMistakes.map((item) => (
                                        <div key={item} className={cn(
                                            "group flex items-start gap-4 rounded-xl border p-5 transition-colors",
                                            isLight ? "border-zinc-200 bg-white hover:bg-zinc-50" : "border-zinc-800 bg-[#1e1e1e] hover:bg-[#252525]"
                                        )}>
                                            <div className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", isLight ? "bg-zinc-400" : "bg-zinc-500")} />
                                            <p className={cn("text-[15px] leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </article>

                    <aside className="hidden lg:block">
                        <div className="sticky top-32 space-y-10">
                            <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">On this page</h4>
                                <nav className={cn("space-y-1 border-l pl-4", isLight ? "border-zinc-200" : "border-zinc-800")}>
                                    {ARTICLE_ANCHORS.map((anchor) => (
                                        <a
                                            key={anchor.id}
                                            href={`#${anchor.id}`}
                                            className={cn(
                                                "block text-[13px] transition-all duration-200 py-1.5 relative group/nav",
                                                activeAnchor === anchor.id
                                                    ? (isLight ? "text-zinc-950 font-medium" : "text-white font-medium")
                                                    : (isLight ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-500 hover:text-zinc-300")
                                            )}
                                        >
                                            {anchor.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>

                            {article.quickActions.length > 0 && (
                                <div className={cn("rounded-xl border p-5", isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-[#1e1e1e]")}>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">Related Actions</h4>
                                    <div className="space-y-2">
                                        {article.quickActions.map((action) => (
                                            <Link
                                                key={action.label}
                                                href={action.href}
                                                className={cn(
                                                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors",
                                                    isLight ? "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950" : "border-zinc-700/60 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                                )}
                                            >
                                                <span>{action.label}</span>
                                                <ArrowRight className="h-4 w-4 text-emerald-400" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    )
}
