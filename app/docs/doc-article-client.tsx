"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, Copy, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"
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
    const [activeAnchor, setActiveAnchor] = useState(ARTICLE_ANCHORS[0].id)
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

    return (
        <section className="pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="mb-10 flex items-center gap-2">
                    <Link href="/docs" className="text-[13px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                        Docs
                    </Link>
                    <span className="text-zinc-600">/</span>
                    <span className="text-[13px] font-medium text-zinc-100">{article.title}</span>
                </div>

                <div className="grid gap-16 lg:grid-cols-[1fr_260px]">
                    <article className="min-w-0">
                        <header className="pb-10 border-b border-zinc-800">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="rounded-xl bg-[#1e1e1e] border border-zinc-800 p-3 shadow-sm">
                                    <Icon className="h-6 w-6 text-zinc-300" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                        {GROUP_LABELS[article.group]}
                                    </p>
                                    <h1 className="mt-1 text-3xl md:text-5xl font-semibold tracking-tight text-white">
                                        {article.title}
                                    </h1>
                                </div>
                            </div>

                            <p className="text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl">
                                {article.purpose}
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-6 text-[13px] text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                                    Updated {article.lastUpdated}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                                    {article.readTime} min read
                                </div>
                            </div>
                        </header>

                        <div className="mt-12 space-y-20">
                            <section id="when-to-use" className="scroll-mt-32">
                                <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">When to Use This</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {article.whenToUse.map((item) => (
                                        <div key={item} className="group relative rounded-xl border border-zinc-800 bg-[#1e1e1e] p-5 transition-all hover:bg-[#252525]">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-zinc-300" />
                                                </div>
                                                <p className="text-[15px] text-zinc-300 leading-relaxed">{item}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 rounded-xl border border-zinc-800 bg-[#1e1e1e] p-8">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Strategic Value</p>
                                    <p className="text-base text-zinc-300 leading-relaxed max-w-2xl">"{GROUP_WHY[article.group]}"</p>
                                </div>
                            </section>

                            <section id="workflow" className="scroll-mt-32">
                                <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Workflow Process</h2>

                                <div className="rounded-xl border border-zinc-800 bg-[#1e1e1e] p-8 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-4">
                                        {workflow.map((step, idx) => (
                                            <div key={step} className="flex items-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-medium text-zinc-500 mb-2">Step {idx + 1}</span>
                                                    <span className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-[13px] font-medium text-zinc-200">
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
                                        <div key={shot.title} className="group rounded-xl border border-zinc-800 bg-[#1e1e1e] p-6 transition-all hover:bg-[#252525]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="rounded-lg bg-zinc-800 p-2 border border-zinc-700">
                                                    <ScanLine className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                                                </div>
                                                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                                                    UI Reference
                                                </p>
                                            </div>
                                            <h3 className="text-[15px] font-medium text-zinc-200">{shot.title}</h3>
                                            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                                                <span className="text-zinc-400">{shot.hint}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="steps" className="scroll-mt-32">
                                <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Detailed Instructions</h2>
                                <div className="space-y-4">
                                    {article.steps.map((step, index) => (
                                        <div key={index} className="group rounded-xl border border-zinc-800 bg-[#1e1e1e] p-6 transition-all hover:bg-[#252525]">
                                            <div className="flex items-start gap-5">
                                                <div className="flex-shrink-0 flex items-center justify-center mt-0.5">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[13px] font-medium text-zinc-300 border border-zinc-700">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-[15px] leading-relaxed text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                                        {step}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="example" className="scroll-mt-32">
                                <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Practical Application</h2>
                                <div className="rounded-2xl border border-zinc-800 bg-[#1e1e1e] p-8 md:p-10">
                                    <div className="max-w-2xl">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Real Scenario</p>
                                        <p className="text-lg font-medium text-zinc-200 leading-relaxed">
                                            "{article.example}"
                                        </p>
                                    </div>

                                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                                        {article.tip && (
                                            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-5">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Pro Tip</p>
                                                <p className="text-sm text-zinc-300 leading-relaxed">{article.tip}</p>
                                            </div>
                                        )}
                                        {article.warning && (
                                            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-5">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Important Check</p>
                                                <p className="text-sm text-zinc-300 leading-relaxed">{article.warning}</p>
                                            </div>
                                        )}
                                    </div>

                                    {article.copyExample && (
                                        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#1e1e1e]">
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
                                                            ? "bg-zinc-700 text-white border-zinc-600"
                                                            : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border-zinc-700"
                                                    )}
                                                >
                                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    {copied ? "Copied" : "Copy snippet"}
                                                </button>
                                            </div>
                                            <div className="p-5 overflow-x-auto bg-[#1a1a1a]">
                                                <pre className="text-[13px] text-zinc-300 font-mono leading-relaxed">
                                                    <code>{article.copyExample}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section id="issues" className="scroll-mt-32">
                                <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Common Gotchas</h2>
                                <div className="space-y-3">
                                    {article.commonMistakes.map((item) => (
                                        <div key={item} className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-[#1e1e1e] p-5 group transition-colors hover:bg-[#252525]">
                                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                                            <p className="text-[15px] text-zinc-300 leading-relaxed">{item}</p>
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
                                <nav className="space-y-1 border-l border-zinc-800 pl-4">
                                    {ARTICLE_ANCHORS.map((anchor) => (
                                        <a
                                            key={anchor.id}
                                            href={`#${anchor.id}`}
                                            className={cn(
                                                "block text-[13px] transition-all duration-200 py-1.5 relative group/nav",
                                                activeAnchor === anchor.id
                                                    ? "text-white font-medium"
                                                    : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            {anchor.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>

                            {article.quickActions.length > 0 && (
                                <div className="rounded-xl border border-zinc-800 bg-[#1e1e1e] p-5">
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">Related Actions</h4>
                                    <div className="space-y-2">
                                        {article.quickActions.map((action) => (
                                            <Link
                                                key={action.label}
                                                href={action.href}
                                                className="flex items-center gap-2 text-[13px] font-medium text-zinc-300 hover:text-white transition-colors group/link bg-zinc-800/50 hover:bg-zinc-800 py-2 px-3 rounded-lg border border-zinc-700/50"
                                            >
                                                {action.label}
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
