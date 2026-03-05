"use client"

import {
    FileText,
    BookOpen,
    Package,
    BarChart,
    Smartphone,
    HelpCircle,
    CheckCircle2,
    Zap,
    Layers,
    LayoutDashboard
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const modules = [
    {
        name: "Billing & Invoicing",
        description: "GST-ready billing, multi-format PDFs, and quick search commands keep every sale organized.",
        status: "Live",
        icon: FileText,
        color: "emerald"
    },
    {
        name: "Khata & Ledgers",
        description: "Customer balances, supplier dues, and ledger snapshots with automatic reminders.",
        status: "Live",
        icon: BookOpen,
        color: "blue"
    },
    {
        name: "Inventory",
        description: "Stock levels, low stock alerts, and batch controls that sync across devices.",
        status: "Live",
        icon: Package,
        color: "indigo"
    },
    {
        name: "Reports & Analytics",
        description: "Simple dashboards summarize daily sales, outlet performance, and collections.",
        status: "Live",
        icon: LayoutDashboard,
        color: "violet"
    },
    {
        name: "Offline PWA",
        description: "Installable experience for phones/tablets. Work continues even without connectivity.",
        status: "Live",
        icon: Smartphone,
        color: "cyan"
    },
    {
        name: "Self Help",
        description: "Docs, FAQs, and step-by-step guides for setup, billing, and compliance.",
        status: "Available",
        icon: HelpCircle,
        color: "amber"
    }
]

export function AvailabilitySection() {
    return (
        <section className="bg-white text-zinc-900 py-32 md:py-48 overflow-hidden relative">
            {/* Subtle Radiance */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#f1f5f9_0%,transparent_70%)]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-12 gap-16 items-start">

                    {/* Sticky Sidebar Header */}
                    <div className="lg:col-span-4 lg:sticky lg:top-40 space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                <Zap size={14} className="fill-emerald-500" />
                                Ecosystem Status
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-8">
                                Ready for <br />
                                <span className="text-zinc-500 italic">your shop.</span>
                            </h2>
                            <p className="text-zinc-500 text-lg font-light leading-relaxed">
                                Every listed module is live and optimized to run on entry-level hardware and slow network conditions.
                            </p>
                        </div>

                        <div className="p-6 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 flex items-center gap-4 group hover:bg-zinc-100/50 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-zinc-400">Uptime Reliability</div>
                                <div className="text-lg font-black italic tracking-tighter text-zinc-900">99.98% SLA Guaranteed</div>
                            </div>
                        </div>
                    </div>

                    {/* Features Scroller/Grid */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {modules.map((module, idx) => (
                                <motion.div
                                    key={module.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative rounded-[2.5rem] border border-zinc-200/60 bg-white p-8 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] hover:border-emerald-500/20 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110",
                                            module.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                                module.color === 'blue' ? "bg-blue-50 text-blue-600" :
                                                    module.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                                                        module.color === 'violet' ? "bg-violet-50 text-violet-600" :
                                                            module.color === 'cyan' ? "bg-cyan-50 text-cyan-600" :
                                                                "bg-amber-50 text-amber-600"
                                        )}>
                                            <module.icon className="w-6 h-6" />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-2xl font-black italic tracking-tighter text-zinc-900">{module.name}</h3>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    {module.status}
                                                </div>
                                            </div>
                                            <p className="text-zinc-500 text-sm font-light leading-relaxed">{module.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
