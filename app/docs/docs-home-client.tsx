"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { DOC_BY_SLUG, DOC_HOME_ORDER, GROUP_LABELS, GROUP_ORDER, type DocGroupId } from "./docs-data"

const GROUP_SUMMARY: Record<DocGroupId, string> = {
    "start-here": "Set up your workspace and complete the first full workflow.",
    "daily-billing": "Track payments, generate GST invoices, and manage daily sales.",
    "khata-payments": "Maintain running balances and record dues with confidence.",
    inventory: "Update stock, validate counts, and avoid inventory mismatch.",
    "gst-reports": "Validate tax data and prepare clean GST-ready exports.",
    "teams-staff": "Set role access so day-to-day work stays controlled and secure.",
    "admin-data": "Import old records safely and verify totals after migration.",
    plans: "Review plan limits and scale without workflow interruptions.",
    "fix-problems": "Resolve mismatches and sync issues quickly.",
}

export function DocsHomeClient() {
    const [query, setQuery] = useState("")

    const cards = useMemo(() => {
        const ordered = DOC_HOME_ORDER.map((slug) => DOC_BY_SLUG[slug]).filter(Boolean)
        const q = query.trim().toLowerCase()
        if (!q) return ordered
        return ordered.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.purpose.toLowerCase().includes(q) ||
                item.group.toLowerCase().includes(q)
        )
    }, [query])

    const fixIssuesDoc = DOC_BY_SLUG["fix-common-problems"]
    const isSearching = query.trim().length > 0
    const visibleCards = isSearching
        ? cards
        : cards.filter((item) => item.slug !== "fix-common-problems")

    const groupedCards = useMemo(() => {
        return GROUP_ORDER.map((group) => ({
            group,
            items: visibleCards.filter((item) => item.group === group),
        })).filter((section) => section.items.length > 0)
    }, [visibleCards])

    return (
        <section className="pt-1 pb-8">
            <div className="max-w-6xl mx-auto">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search docs by task... (invoice, payment, gst, import)"
                        className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                    />
                </div>

                {!isSearching && fixIssuesDoc ? (
                    <Link
                        href={`/docs/${fixIssuesDoc.slug}`}
                        className="mt-4 block rounded-md border border-amber-300 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100/70"
                    >
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-amber-800">Fix Issues</p>
                        <h2 className="mt-1 text-sm font-semibold text-zinc-900">{fixIssuesDoc.title}</h2>
                        <p className="mt-1 text-xs text-zinc-700 leading-relaxed">{fixIssuesDoc.purpose}</p>
                    </Link>
                ) : null}

                {isSearching ? (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleCards.map((item) => (
                            <Link
                                key={item.slug}
                                href={`/docs/${item.slug}`}
                                className="group rounded-md border border-zinc-200 bg-white px-3.5 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                                    {GROUP_LABELS[item.group]}
                                </p>
                                <h3 className="mt-1 text-sm font-semibold text-zinc-900 group-hover:text-zinc-950">
                                    {item.title}
                                </h3>
                                <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{item.purpose}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 space-y-5">
                        {groupedCards.map(({ group, items }) => (
                            <section key={group}>
                                <div className="rounded-md border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-4 py-3">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-700">
                                        {GROUP_LABELS[group]}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-600">{GROUP_SUMMARY[group]}</p>
                                </div>

                                <div className="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.map((item) => (
                                        <Link
                                            key={item.slug}
                                            href={`/docs/${item.slug}`}
                                            className="group rounded-md border border-zinc-200 bg-white px-3.5 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                                        >
                                            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-950">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{item.purpose}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {visibleCards.length === 0 ? (
                    <div className="mt-6 rounded-md border border-zinc-200 p-4 text-center">
                        <p className="text-sm font-medium text-zinc-700">
                            No matches yet. Try a simpler keyword like sales, dues, gst, or import.
                        </p>
                    </div>
                ) : null}
            </div>
        </section>
    )
}
