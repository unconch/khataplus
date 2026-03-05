"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search, ArrowRight, BookOpen, Key, Users, FileText } from "lucide-react"
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

// Map groups to specific icons for the feature cards
const GROUP_ICONS: Record<DocGroupId, any> = {
    "start-here": BookOpen,
    "daily-billing": FileText,
    "khata-payments": Key,
    inventory: BookOpen,
    "gst-reports": FileText,
    "teams-staff": Users,
    "admin-data": Key,
    plans: BookOpen,
    "fix-problems": Users,
}

export function DocsHomeClient() {
    // We remove the local search state to match the Sarvam layout where search is in the top navbar.
    // For now, we will render all top-level documentation sections as a 2-column grid.

    const visibleCards = DOC_HOME_ORDER.map((slug) => DOC_BY_SLUG[slug]).filter(Boolean).filter(item => item.slug !== "fix-common-problems")

    const groupedCards = GROUP_ORDER.map((group) => ({
        group,
        items: visibleCards.filter((item) => item.group === group),
    })).filter((section) => section.items.length > 0)

    return (
        <section className="w-full">
            <div className="w-full">
                <div className="space-y-12">
                    {/* Rather than showing grouped headers which clutter the exact Sarvam match, 
                        we will render a flat grid of the most important starting sections, 
                        or keep groups if necessary but closely adhere to the 2-col visual style */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {visibleCards.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.slug}
                                    href={`/docs/${item.slug}`}
                                    className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-[#1e1e1e] hover:bg-[#252525] p-6 transition-all duration-200 overflow-hidden"
                                >
                                    <div className="mb-4">
                                        <Icon className="h-8 w-8 text-zinc-100" strokeWidth={1.5} />
                                    </div>

                                    <div className="flex-1 mt-1">
                                        <h3 className="text-base font-bold text-white transition-colors mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-[14px] text-zinc-400 leading-relaxed font-normal">
                                            {item.purpose}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

