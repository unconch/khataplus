"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
    ArrowRight,
    Briefcase,
    CalendarRange,
    Cpu,
    HandCoins,
    ShieldCheck,
    Shirt,
    Stethoscope,
    Store,
    Truck,
    Utensils,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SOLUTIONS = [
    {
        id: "retail",
        icon: Store,
        title: "Retail & Kirana",
        tagline: "High-Volume Ready",
        description: "Process bills instantly with barcode support. Keep queues moving and automate stock management without breaking a sweat.",
        iconColor: "text-emerald-600",
        bgLight: "bg-emerald-50/80",
        accent: "bg-emerald-500",
        className: "lg:col-span-7",
        chips: ["Barcode Ready", "Fast Billing"],
    },
    {
        id: "wholesale",
        icon: Truck,
        title: "B2B Distribution",
        tagline: "Enterprise Control",
        description: "Track supplier payouts, manage B2B customer ledgers, and handle customized volume pricing with confidence.",
        iconColor: "text-blue-600",
        bgLight: "bg-blue-50/80",
        accent: "bg-blue-500",
        className: "lg:col-span-5",
        chips: ["Bulk Pricing", "Supplier Sync"],
    },
    {
        id: "pharmacy",
        icon: Stethoscope,
        title: "Pharmacy & Medical",
        tagline: "Precision Tracking",
        description: "Manage batch numbers, expiry dates, and automated low-stock clinical alerts with unparalleled accuracy.",
        iconColor: "text-teal-600",
        bgLight: "bg-teal-50/80",
        accent: "bg-teal-500",
        className: "lg:col-span-4",
        chips: ["Expiry Alerts", "Batch Tracking"],
    },
    {
        id: "apparel",
        icon: Shirt,
        title: "Apparel & Fashion",
        tagline: "Matrix Inventory",
        description: "Handle sizes, colors, and seasonal drops with intuitive visual inventory dashboards built for variant-heavy catalogs.",
        iconColor: "text-rose-600",
        bgLight: "bg-rose-50/80",
        accent: "bg-rose-500",
        className: "lg:col-span-4",
        chips: ["Size Matrix", "Color Variants"],
    },
    {
        id: "restaurants",
        icon: Utensils,
        title: "Restaurants & Cafes",
        tagline: "Rapid Service",
        description: "Manage tables, digital menus, and kitchen order tickets while keeping service smooth during peak dining hours.",
        iconColor: "text-amber-600",
        bgLight: "bg-amber-50/80",
        accent: "bg-amber-500",
        className: "lg:col-span-4",
        chips: ["Table Flow", "KOT Ready"],
    },
    {
        id: "electronics",
        icon: Cpu,
        title: "Electronics & Mobile",
        tagline: "Serial Management",
        description: "Track IMEI numbers, manage serial warranties, and handle high-value product movement with more control.",
        iconColor: "text-indigo-600",
        bgLight: "bg-indigo-50/80",
        accent: "bg-indigo-500",
        className: "lg:col-span-5",
        chips: ["IMEI Tracking", "Warranty Notes"],
    },
    {
        id: "services",
        icon: Briefcase,
        title: "Service Agencies",
        tagline: "Professional Billing",
        description: "Generate compliant invoices for clients, track project expenses, and maintain clean reporting for service-led businesses.",
        iconColor: "text-fuchsia-600",
        bgLight: "bg-fuchsia-50/80",
        accent: "bg-fuchsia-500",
        className: "lg:col-span-4",
        chips: ["Tax Invoices", "Project Costs"],
    },
    {
        id: "credit",
        icon: HandCoins,
        title: "Finance & Credit",
        tagline: "Digital Ledger",
        description: "Replace physical registers with transparent credit tracking and automated reminder workflows for customer follow-up.",
        iconColor: "text-orange-600",
        bgLight: "bg-orange-50/80",
        accent: "bg-orange-500",
        className: "lg:col-span-3",
        chips: ["Credit Ledger", "Auto Reminders"],
    },
]

export function SolutionsSection({ isFullPage = false }: { isFullPage?: boolean }) {
    return (
        <section
            id="solutions"
            className={cn(
                "relative overflow-hidden px-6",
                isFullPage ? "py-16" : "py-20 md:py-24"
            )}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.09),transparent_34%)]" />
                <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,_#0f172a_1px,_transparent_1px)] [background-size:28px_28px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="mb-12 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="space-y-5"
                    >
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                Industry Intelligence
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-5xl font-bold tracking-tighter text-zinc-950 md:text-7xl lg:text-8xl leading-[0.95]">
                                Built for the way
                                <br />
                                <span className="text-zinc-400">your industry works.</span>
                            </h2>
                            <p className="max-w-2xl text-lg font-light leading-relaxed text-zinc-500 md:text-2xl">
                                Purpose-built workflows for retail, distribution, pharmacy, apparel, food service, and more without forcing every business into the same template.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.08 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-2 gap-3 self-stretch sm:w-[360px]"
                    >
                        <InfoCard icon={Store} label="Industries" value="8+" />
                        <InfoCard icon={CalendarRange} label="Use Cases" value="Daily" />
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
                    {SOLUTIONS.map((solution, index) => (
                        <motion.div
                            key={solution.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: index * 0.04 }}
                            viewport={{ once: true, margin: "-80px" }}
                            className={solution.className}
                        >
                            <IndustryCard solution={solution} />
                        </motion.div>
                    ))}
                </div>

                {!isFullPage && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="mt-12"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/70 bg-white/80 p-8 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:p-10">
                            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.10),transparent_45%,rgba(59,130,246,0.10))]" />
                            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                                        Need a workflow that fits your shop exactly?
                                    </h3>
                                    <p className="max-w-2xl text-sm font-medium leading-relaxed text-zinc-500 md:text-base">
                                        KhataPlus can be shaped around how your counter, team, and customers actually operate.
                                    </p>
                                </div>
                                <Link
                                    href="/auth/sign-up"
                                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600"
                                >
                                    Start Free Demo
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    )
}

function IndustryCard({
    solution,
}: {
    solution: (typeof SOLUTIONS)[number]
}) {
    return (
        <div
            className={cn(
                "group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white/85 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.38)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_40px_100px_-45px_rgba(15,23,42,0.45)] md:p-8",
                solution.bgLight
            )}
        >
            <div className={cn("absolute right-0 top-0 h-36 w-36 translate-x-1/3 -translate-y-1/3 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-35", solution.accent)} />

            <div className="relative z-10 flex items-start justify-between gap-4">
                <div className={cn("flex h-16 w-16 items-center justify-center rounded-3xl border border-white/80 bg-white shadow-sm transition-transform duration-500 group-hover:scale-110", solution.iconColor)}>
                    <solution.icon size={30} strokeWidth={1.6} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                    {solution.chips.map((chip) => (
                        <div
                            key={chip}
                            className="rounded-full border border-zinc-200/70 bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500"
                        >
                            {chip}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
                <div>
                    <div className={cn("mb-3 text-[10px] font-black uppercase tracking-[0.24em]", solution.iconColor)}>
                        {solution.tagline}
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-zinc-950">
                        {solution.title}
                    </h3>
                </div>
                <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-500 md:text-[15px]">
                    {solution.description}
                </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                <span className="text-zinc-900">Explore solution</span>
                <ArrowRight size={14} className={cn("transition-transform duration-500 group-hover:translate-x-1", solution.iconColor)} />
            </div>
        </div>
    )
}

function InfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Store
    label: string
    value: string
}) {
    return (
        <div className="rounded-[1.5rem] border border-zinc-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 text-zinc-500">
                <Icon size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</span>
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-zinc-950">{value}</div>
        </div>
    )
}
