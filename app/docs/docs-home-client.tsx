"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, FileText, Key, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { DOC_BY_SLUG, DOC_HOME_ORDER, GROUP_LABELS, type DocGroupId } from "./docs-data"
import { useDocsNav } from "./docs-nav-provider"

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
    const { theme } = useDocsNav()
    const isLight = theme === "light"
    const visibleCards = DOC_HOME_ORDER.map((slug) => DOC_BY_SLUG[slug]).filter(Boolean)
    const quickStart = DOC_BY_SLUG["quick-start-5-minute-guide"]
    const otherCards = visibleCards.filter((item) => item.slug !== "quick-start-5-minute-guide")

    return (
        <section className="w-full">
            <div className="w-full space-y-10">
                <div className="max-w-2xl">
                    <div>
                        <h2 className={cn("text-sm font-black uppercase tracking-[0.18em]", "text-zinc-500")}>Start here</h2>
                        <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>
                            One quick start, then a clean set of guides for billing, khata, stock, GST, and fixes.
                        </p>
                    </div>
                </div>

                {quickStart && (
                    <Link
                        href={`/docs/${quickStart.slug}`}
                        className={cn(
                            "group block border-b pb-8 transition-all",
                            isLight
                                ? "border-zinc-200/90 hover:border-zinc-300"
                                : "border-zinc-800/90 hover:border-zinc-700"
                        )}
                    >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
                                    Quickstart &lt; 5 min
                                </div>
                                <h3 className={cn("mt-4 text-2xl font-bold tracking-tight md:text-3xl", isLight ? "text-zinc-950" : "text-white")}>
                                    {quickStart.title}
                                </h3>
                                <p className={cn("mt-3 text-base leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>{quickStart.purpose}</p>
                                {quickStart.clickGuide[0] && (
                                    <p className={cn("mt-4 text-sm font-medium", isLight ? "text-zinc-700" : "text-zinc-300")}>
                                        In app: <span className="font-bold">{quickStart.clickGuide[0].page}</span> - {quickStart.clickGuide[0].button}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className={cn("text-sm", isLight ? "text-zinc-500" : "text-zinc-400")}>{quickStart.readTime} read</div>
                                <div
                                    className={cn(
                                        "inline-flex items-center gap-2 text-sm font-bold transition-transform duration-200 group-hover:translate-x-1",
                                        isLight ? "text-zinc-950" : "text-white"
                                    )}
                                >
                                    Start walkthrough
                                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {otherCards.map((item) => {
                        const Icon = item.icon
                        const GroupIcon = GROUP_ICONS[item.group]
                        const firstClick = item.clickGuide[0]

                        return (
                            <Link
                                key={item.slug}
                                href={`/docs/${item.slug}`}
                                className={cn(
                                    "group block rounded-[1.5rem] border p-5 transition-all",
                                    isLight
                                        ? "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60"
                                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/70"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div
                                        className={cn(
                                            "inline-flex h-12 w-12 items-center justify-center rounded-2xl border",
                                            isLight ? "border-zinc-200 bg-zinc-50 text-zinc-900" : "border-zinc-800 bg-zinc-900 text-zinc-100"
                                        )}
                                    >
                                        <Icon className="h-6 w-6" strokeWidth={1.6} />
                                    </div>
                                    <div
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]",
                                            isLight ? "border-zinc-200 bg-white text-zinc-500" : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                        )}
                                    >
                                        <GroupIcon className="h-3.5 w-3.5" strokeWidth={1.7} />
                                        {GROUP_LABELS[item.group]}
                                    </div>
                                </div>

                                <h3 className={cn("mt-5 text-xl font-bold tracking-tight", isLight ? "text-zinc-950" : "text-white")}>{item.title}</h3>
                                <p className={cn("mt-3 text-[14px] leading-relaxed", isLight ? "text-zinc-600" : "text-zinc-400")}>{item.purpose}</p>

                                {firstClick && (
                                    <p className={cn("mt-4 text-sm leading-relaxed", isLight ? "text-zinc-700" : "text-zinc-300")}>
                                        <span className="font-semibold">In app:</span> {firstClick.page} - {firstClick.button}
                                    </p>
                                )}

                                <div className={cn("mt-5 flex items-center justify-between border-t pt-4", isLight ? "border-zinc-200" : "border-zinc-800")}>
                                    <div className={cn("text-[12px] font-semibold", isLight ? "text-zinc-500" : "text-zinc-500")}>{item.readTime} read</div>
                                    <div
                                        className={cn(
                                            "inline-flex items-center gap-2 text-sm font-bold transition-transform duration-200 group-hover:translate-x-1",
                                            isLight ? "text-zinc-950" : "text-white"
                                        )}
                                    >
                                        Open guide
                                        <ArrowRight className="h-4 w-4 text-emerald-400" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
