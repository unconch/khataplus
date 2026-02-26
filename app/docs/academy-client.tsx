"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    ShoppingBag,
    ShieldCheck,
    Smartphone,
    Zap,
    Search,
    ArrowRight,
    CheckCircle2,
    Clock3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { Button } from "@/components/ui/button"

type ModuleLevel = "starter" | "growth" | "advanced"
type AcademyModule = {
    id: string
    icon: any
    title: string
    desc: string
    level: ModuleLevel
    eta: string
    actionLabel: string
    actionPath: string
    lessons: string[]
    defaultProgress: number
    color: "emerald" | "blue" | "rose" | "amber"
}

const ACADEMY_MODULES: AcademyModule[] = [
    {
        id: "inventory",
        icon: ShoppingBag,
        title: "Inventory Mastery",
        desc: "Build reorder discipline, reduce dead stock, and avoid stockouts.",
        level: "starter",
        eta: "15 min",
        actionLabel: "Open Inventory",
        actionPath: "/dashboard/inventory",
        lessons: ["Reorder thresholds", "Fast stock edit", "Daily restock rhythm"],
        defaultProgress: 35,
        color: "emerald",
    },
    {
        id: "compliance",
        icon: ShieldCheck,
        title: "Tax & Compliance",
        desc: "Configure GST the right way and keep billing audit-ready.",
        level: "growth",
        eta: "20 min",
        actionLabel: "Open GST Reports",
        actionPath: "/dashboard/reports/gst",
        lessons: ["GST toggle setup", "HSN discipline", "Monthly filing checklist"],
        defaultProgress: 15,
        color: "blue",
    },
    {
        id: "pwa",
        icon: Smartphone,
        title: "PWA Field Workflow",
        desc: "Run your counter smoothly on weak networks with offline habits.",
        level: "starter",
        eta: "10 min",
        actionLabel: "Open Offline Guide",
        actionPath: "/offline",
        lessons: ["Offline-safe actions", "Sync expectations", "Install best practices"],
        defaultProgress: 0,
        color: "rose",
    },
    {
        id: "staff",
        icon: Zap,
        title: "Staff Ops Playbook",
        desc: "Set role boundaries and speed up handovers between shifts.",
        level: "advanced",
        eta: "12 min",
        actionLabel: "Open Settings",
        actionPath: "/dashboard/settings",
        lessons: ["Permission matrix", "Session hygiene", "Change control"],
        defaultProgress: 0,
        color: "amber",
    },
]

const LEVELS: { label: string; value: "all" | ModuleLevel }[] = [
    { label: "All", value: "all" },
    { label: "Starter", value: "starter" },
    { label: "Growth", value: "growth" },
    { label: "Advanced", value: "advanced" },
]

const STORAGE_KEY = "academy_progress_v1"

export function AcademyContentClient({
    isAuthenticated,
    orgSlug,
}: {
    isAuthenticated: boolean
    orgSlug: string | null
}) {
    const [searchQuery, setSearchQuery] = useState("")
    const [levelFilter, setLevelFilter] = useState<"all" | ModuleLevel>("all")
    const [progressMap, setProgressMap] = useState<Record<string, number>>({})

    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === "object") setProgressMap(parsed)
        } catch {
            // ignore bad local storage values
        }
    }, [])

    const targetBase = isAuthenticated
        ? orgSlug
            ? `/${orgSlug}`
            : ""
        : "/auth/sign-up"

    const modules = useMemo(() => {
        return ACADEMY_MODULES.map((m) => ({
            ...m,
            progress: Number.isFinite(progressMap[m.id]) ? progressMap[m.id] : m.defaultProgress,
        }))
    }, [progressMap])

    const filteredModules = useMemo(() => {
        return modules.filter((mod) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                mod.title.toLowerCase().includes(q) ||
                mod.desc.toLowerCase().includes(q) ||
                mod.lessons.some((lesson) => lesson.toLowerCase().includes(q))
            const matchesLevel = levelFilter === "all" || mod.level === levelFilter
            return matchesSearch && matchesLevel
        })
    }, [modules, searchQuery, levelFilter])

    const nextRecommended = useMemo(() => {
        return [...modules].sort((a, b) => a.progress - b.progress)[0]
    }, [modules])

    const updateProgress = (id: string, next: number) => {
        const safe = Math.max(0, Math.min(100, next))
        setProgressMap((prev) => {
            const updated = { ...prev, [id]: safe }
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            }
            return updated
        })
    }

    return (
        <>
            <div className="max-w-4xl mx-auto mt-8 space-y-4">
                <div className="rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-md p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-black text-emerald-300">Recommended next</p>
                        <p className="text-sm text-white font-bold">{nextRecommended?.title || "Start with Inventory Mastery"}</p>
                    </div>
                    <Link
                        href={isAuthenticated ? `${targetBase}${nextRecommended?.actionPath || "/dashboard"}` : "/auth/sign-up"}
                        className="inline-flex items-center text-[11px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200"
                    >
                        Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search modules and lessons"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {LEVELS.map((level) => (
                            <button
                                key={level.value}
                                type="button"
                                onClick={() => setLevelFilter(level.value)}
                                className={cn(
                                    "px-3 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg border transition-colors whitespace-nowrap",
                                    levelFilter === level.value
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                                        : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10"
                                )}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <section className="py-14 px-6 bg-zinc-50">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-950">Merchant Academy</h2>
                        <p className="text-zinc-500 text-sm font-medium">Active learning tracks linked to real app actions.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {filteredModules.length > 0 ? (
                            filteredModules.map((mod, i) => (
                                <AcademyModuleCard
                                    key={mod.id}
                                    module={mod}
                                    targetBase={targetBase}
                                    isAuthenticated={isAuthenticated}
                                    delay={i * 40}
                                    onProgressStep={() => updateProgress(mod.id, mod.progress >= 100 ? 100 : mod.progress + 20)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center space-y-3">
                                <h3 className="text-xl font-black text-zinc-950">No modules match your filter.</h3>
                                <p className="text-zinc-500 text-sm">Try a different query or level.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}

function AcademyModuleCard({
    module,
    targetBase,
    isAuthenticated,
    delay,
    onProgressStep,
}: {
    module: AcademyModule & { progress: number }
    targetBase: string
    isAuthenticated: boolean
    delay: number
    onProgressStep: () => void
}) {
    const Icon = module.icon

    const barColor = {
        emerald: "bg-emerald-500",
        blue: "bg-blue-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
    }[module.color]

    const actionHref = isAuthenticated ? `${targetBase}${module.actionPath}` : "/auth/sign-up"

    return (
        <AdvancedScrollReveal variant="slideUp" delay={delay}>
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col h-full">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                            <Icon size={18} className="text-zinc-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-zinc-950">{module.title}</h3>
                            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-0.5">
                                <span>{module.level}</span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock3 className="h-3 w-3" /> {module.eta}
                                </span>
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{module.progress}%</span>
                </div>

                <p className="text-sm text-zinc-600 mt-3 leading-relaxed">{module.desc}</p>

                <div className="mt-4 space-y-2">
                    {module.lessons.map((lesson) => (
                        <div key={lesson} className="flex items-center gap-2 text-xs text-zinc-600">
                            <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
                            {lesson}
                        </div>
                    ))}
                </div>

                <div className="mt-4 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-700", barColor)} style={{ width: `${module.progress}%` }} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <Button asChild className="h-9 text-[10px] uppercase tracking-widest font-black">
                        <Link href={actionHref}>
                            {module.actionLabel}
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 text-[10px] uppercase tracking-widest font-black"
                        onClick={onProgressStep}
                    >
                        Mark Progress
                    </Button>
                </div>
            </div>
        </AdvancedScrollReveal>
    )
}

