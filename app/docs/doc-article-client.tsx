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
        <section className="pt-4 pb-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-3">
                    <Link href="/docs" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                        Back to Documentation
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                    <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-auto lg:pr-2">
                        <details className="rounded-md border border-zinc-200 bg-white lg:hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700">
                                On this page
                                <ChevronDown className="h-4 w-4 text-zinc-500" />
                            </summary>
                            <nav className="border-t border-zinc-200 px-3 py-2 space-y-1">
                                {ARTICLE_ANCHORS.map((anchor) => (
                                    <a
                                        key={anchor.id}
                                        href={`#${anchor.id}`}
                                        className={cn(
                                            "block border-l-2 py-1 pl-2 text-xs transition-colors",
                                            activeAnchor === anchor.id
                                                ? "border-zinc-500 text-zinc-900"
                                                : "border-transparent text-zinc-600 hover:text-zinc-900"
                                        )}
                                    >
                                        {anchor.label}
                                    </a>
                                ))}
                            </nav>
                        </details>

                        <div className="hidden lg:block space-y-3">
                            <details open className="rounded-md border border-zinc-200 bg-white">
                                <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700">
                                    On this page
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                </summary>
                                <nav className="border-t border-zinc-200 px-3 py-2 space-y-1">
                                    {ARTICLE_ANCHORS.map((anchor) => (
                                        <a
                                            key={anchor.id}
                                            href={`#${anchor.id}`}
                                            className={cn(
                                                "block border-l-2 py-1 pl-2 text-xs transition-colors",
                                                activeAnchor === anchor.id
                                                    ? "border-zinc-500 text-zinc-900"
                                                    : "border-transparent text-zinc-600 hover:text-zinc-900"
                                            )}
                                        >
                                            {anchor.label}
                                        </a>
                                    ))}
                                </nav>
                            </details>

                            <details open className="rounded-md border border-zinc-200 bg-white">
                                <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700">
                                    Quick actions
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                </summary>
                                <div className="border-t border-zinc-200 px-3 py-2 space-y-1">
                                    {article.quickActions.map((action) => (
                                        <Link key={action.label} href={action.href} className="block text-xs text-zinc-600 hover:text-zinc-900">
                                            {action.label}
                                        </Link>
                                    ))}
                                </div>
                            </details>
                        </div>
                    </aside>

                    <article className="min-w-0">
                        <header className="pb-8 border-b border-zinc-200">
                            <div className="rounded-md border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 rounded-sm bg-white p-1.5 border border-zinc-200">
                                        <Icon className="h-4 w-4 text-zinc-700" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                                            {GROUP_LABELS[article.group]}
                                        </p>
                                        <p className="mt-1 text-sm text-zinc-700">{article.purpose}</p>
                                    </div>
                                </div>
                            </div>

                            <h1 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
                                {article.title}
                            </h1>
                            <p className="mt-2 text-sm text-zinc-500">
                                Updated {article.lastUpdated} | {article.readTime} read
                            </p>
                            <p className="mt-3 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-sm text-zinc-700">
                                {GROUP_REASSURE[article.group]}
                            </p>
                        </header>

                        <section id="when-to-use" className="scroll-mt-24 mt-12">
                            <h2 className="text-xl font-semibold text-zinc-900">When to Use This</h2>
                            <ul className="mt-4 list-disc pl-5 space-y-2">
                                {article.whenToUse.map((item) => (
                                    <li key={item} className="text-sm text-zinc-600">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-700">Why this matters</p>
                                <p className="mt-2 text-sm text-zinc-700">{GROUP_WHY[article.group]}</p>
                            </div>
                        </section>

                        <section id="workflow" className="scroll-mt-24 mt-12">
                            <h2 className="text-xl font-semibold text-zinc-900">Workflow</h2>
                            <div className="mt-4 overflow-x-auto">
                                <div className="inline-flex min-w-full items-center gap-2 rounded-md border border-zinc-200 bg-white p-3">
                                    {workflow.map((step, idx) => (
                                        <div key={step} className="inline-flex items-center gap-2">
                                            <span className="rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700">
                                                {step}
                                            </span>
                                            {idx < workflow.length - 1 ? <span className="text-zinc-400">{"->"}</span> : null}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                {uiFocus.map((shot) => (
                                    <div key={shot.title} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                                        <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-600">
                                            <ScanLine className="h-3.5 w-3.5" />
                                            UI Snapshot
                                        </p>
                                        <h3 className="mt-1 text-sm font-semibold text-zinc-900">{shot.title}</h3>
                                        <p className="mt-1 text-xs text-zinc-600">{shot.hint}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="steps" className="scroll-mt-24 mt-12">
                            <h2 className="text-xl font-semibold text-zinc-900">Steps</h2>
                            <ol className="mt-4 space-y-3">
                                {article.steps.map((step, index) => (
                                    <li key={step} className="rounded-md border border-zinc-200 bg-white p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700">
                                                {index + 1}
                                            </span>
                                            <p className="text-sm leading-relaxed text-zinc-700">{step}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section id="example" className="scroll-mt-24 mt-12">
                            <h2 className="text-xl font-semibold text-zinc-900">Real Example</h2>
                            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Example</p>
                                <p className="mt-2 text-sm text-zinc-700">{article.example}</p>
                            </div>

                            {article.tip ? (
                                <div className="mt-3 rounded-md border border-blue-200 bg-blue-50/60 p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-blue-700">Helpful note</p>
                                    <p className="mt-2 text-sm text-zinc-700">{article.tip}</p>
                                </div>
                            ) : null}

                            {article.warning ? (
                                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/70 p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-amber-700">Common mistake</p>
                                    <p className="mt-2 text-sm text-zinc-700">{article.warning}</p>
                                </div>
                            ) : null}

                            {article.copyExample ? (
                                <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Structured Example</p>
                                        <button
                                            type="button"
                                            onClick={doCopy}
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium",
                                                copied
                                                    ? "border-green-300 bg-green-50 text-green-700"
                                                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                                            )}
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                    <pre className="mt-2 overflow-x-auto text-xs text-zinc-700">{article.copyExample}</pre>
                                </div>
                            ) : null}
                        </section>

                        <section id="issues" className="scroll-mt-24 mt-12 pt-10 border-t border-zinc-200">
                            <h2 className="text-xl font-semibold text-zinc-900">Common Issues</h2>
                            <ul className="mt-4 list-disc pl-5 space-y-2">
                                {article.commonMistakes.map((item) => (
                                    <li key={item} className="text-sm text-zinc-600">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </article>
                </div>
            </div>
        </section>
    )
}
