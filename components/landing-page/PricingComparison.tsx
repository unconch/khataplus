"use client"

import React, { useState } from "react"
import {
    Check,
    Minus,
    Layout,
    Users,
    FileText,
    Database,
    Zap,
    Star,
    MessageSquare,
    Globe,
    Languages,
    MapPin,
    Shield,
    Sparkles,
    ZapOff,
    Clock,
    ChevronDown,
    ChevronUp,
    PhoneCall,
    BarChart3
} from "lucide-react"

interface Feature {
    name: string
    icon: React.ReactNode
    keep: any
    starter: any
    pro: any
    biz: any
}

interface Category {
    name: string
    features: Feature[]
}

const pricingData: Category[] = [
    {
        name: "Core Billing",
        features: [
            { name: "Invoice Limit", keep: "10/mo", starter: "Unlimited", pro: "Unlimited", biz: "Unlimited", icon: <Layout size={18} /> },
            { name: "Staff Member Seats", keep: "Owner only", starter: "3 Seats", pro: "10 Seats", biz: "Unlimited", icon: <Users size={18} /> },
            { name: "PDF Billing", keep: true, starter: true, pro: true, biz: true, icon: <FileText size={18} /> },
            { name: "Supplier Ledger", keep: "View only", starter: true, pro: true, biz: true, icon: <Database size={18} /> },
        ]
    },
    {
        name: "Inventory & Growth",
        features: [
            { name: "Inventory Items", keep: "30 Items", starter: "200 Items", pro: "Unlimited", biz: "Unlimited", icon: <Database size={18} /> },
            { name: "Low Stock Alerts", keep: "—", starter: true, pro: true, biz: true, icon: <Sparkles size={18} /> },
            { name: "Store Locations", keep: "1", starter: "1", pro: "3", biz: "Unlimited", icon: <MapPin size={18} /> },
        ]
    },
    {
        name: "Communication & Web",
        features: [
            { name: "WhatsApp Share", keep: "Manual", starter: "Manual", pro: "Manual + Auto(v2)", biz: "Automation(v2)", icon: <MessageSquare size={18} /> },
            { name: "Auto Reminders", keep: "—", starter: "—", pro: "v2", biz: "v2", icon: <Clock size={18} /> },
            { name: "Public Shop Profile", keep: "—", starter: "—", pro: true, biz: true, icon: <Star size={18} /> },
        ]
    },
    {
        name: "Compliance & Localization",
        features: [
            { name: "GST Reporting", keep: "Past only", starter: "Full", pro: "Portal Sync", biz: "Advanced", icon: <FileText size={18} /> },
            { name: "Regional Languages", keep: true, starter: true, pro: true, biz: true, icon: <Languages size={18} /> },
        ]
    },
    {
        name: "Platform Capabilities",
        features: [
            { name: "PWA Offline Mode", keep: true, starter: true, pro: true, biz: true, icon: <ZapOff size={18} /> },
            { name: "Vyapar Import", keep: "—", starter: true, pro: true, biz: true, icon: <Zap size={18} /> },
        ]
    },
    {
        name: "Intelligence & Automation",
        features: [
            { name: "Business Dashboard", keep: "—", starter: "—", pro: true, biz: true, icon: <BarChart3 size={18} /> },
            { name: "AI Stock Prediction", keep: "—", starter: "—", pro: "Basic (v2)", biz: "Custom (v3)", icon: <Sparkles size={18} /> },
            { name: "Integrated Payments", keep: "—", starter: "—", pro: "v2", biz: "v2", icon: <Zap size={18} /> },
        ]
    }
]

const plans = [
    { name: "Keep", price: "₹ 33/mo", sub: "₹ 399/yr", color: "zinc" },
    { name: "Starter", price: "₹ 124/mo", sub: "₹ 1,499/yr", color: "blue" },
    { name: "Pro", price: "₹ 333/mo", sub: "₹ 3,999/yr", color: "emerald", recommended: true },
    { name: "Business", price: "₹ 666/mo", sub: "₹ 7,999/yr", color: "indigo" },
]

export function PricingComparison() {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

    const toggleCategory = (name: string) => {
        setCollapsed(prev => ({ ...prev, [name]: !prev[name] }))
    }

    return (
        <div className="max-w-7xl mx-auto mt-12 md:mt-20 px-6 pb-24">
            <div className="text-center mb-24">
                <h3
                    className="text-4xl md:text-5xl font-black text-zinc-950 mb-6 tracking-tight italic animate-in fade-in slide-up duration-500"
                >
                    Detailed Feature Matrix.
                </h3>
                <p
                    className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto animate-in fade-in slide-up duration-500 delay-100"
                >
                    Absolute transparency on every capability for every stage.
                </p>
            </div>

            <div className="relative">
                <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
                    <div className="overflow-x-auto rounded-[2.5rem]">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-white border-b border-zinc-100 sticky top-0 z-40 shadow-sm">
                                    <th className="sticky left-0 bg-white z-50 py-10 px-10 text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] min-w-[280px]">
                                        Capabilities
                                    </th>
                                    {plans.map((plan) => (
                                        <th key={plan.name} className={`relative pt-20 pb-12 px-10 min-w-[180px] bg-white ${plan.recommended ? 'bg-emerald-50/50' : ''}`}>
                                            {plan.recommended && (
                                                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-xl shadow-emerald-500/40 whitespace-nowrap z-50 tracking-widest uppercase border-4 border-white">
                                                    Recommended
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-sm font-black uppercase tracking-widest ${plan.recommended ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                                    {plan.name}
                                                </span>
                                                <span className="text-xl font-black text-zinc-950 tracking-tighter">
                                                    {plan.price}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                                    {plan.sub}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {pricingData.map((category, catIdx) => (
                                    <React.Fragment key={category.name}>
                                        {/* Category Header */}
                                        <tr
                                            onClick={() => toggleCategory(category.name)}
                                            className="bg-zinc-50/30 cursor-pointer hover:bg-zinc-50 transition-colors"
                                        >
                                            <td colSpan={5} className="py-4 px-10">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                                        {category.name}
                                                    </span>
                                                    <div className="h-px bg-zinc-100 flex-1" />
                                                    {collapsed[category.name] ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronUp size={14} className="text-zinc-400" />}
                                                </div>
                                            </td>
                                        </tr>

                                        {!collapsed[category.name] && category.features.map((f, i) => (
                                            <tr
                                                key={f.name}
                                                className="group hover:bg-slate-50 transition-all duration-300 animate-in fade-in slide-up duration-300"
                                            >
                                                <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-20 py-6 px-10 border-r border-zinc-50 shadow-[4px_0_10px_-10px_rgba(0,0,0,0.1)]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-zinc-400 group-hover:text-emerald-500 transition-colors">
                                                            {f.icon}
                                                        </div>
                                                        <span className="text-zinc-600 font-bold group-hover:text-zinc-950 transition-colors text-sm tracking-tight">{f.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-10">
                                                    <Cell value={f.keep} plan="zinc" />
                                                </td>
                                                <td className="py-6 px-10">
                                                    <Cell value={f.starter} plan="blue" />
                                                </td>
                                                <td className="py-6 px-10 bg-emerald-50/20 group-hover:bg-emerald-50/40 relative">
                                                    {/* Glow effect on hover for Pro column */}
                                                    <div className="absolute inset-0 border-x border-emerald-500/0 group-hover:border-emerald-500/10 group-hover:shadow-[inset_0_0_20px_-10px_rgba(16,185,129,0.1)] transition-all pointer-events-none" />
                                                    <Cell value={f.pro} plan="emerald" isPro />
                                                </td>
                                                <td className="py-6 px-10">
                                                    <Cell value={f.biz} plan="indigo" />
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-16 text-center" />
        </div>
    )
}

function Cell({ value, plan, isPro }: { value: any; plan: string; isPro?: boolean }) {
    if (value === true) {
        return (
            <div className={`p-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 ${isPro ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-100 border-slate-200'}`}>
                <Check className={`w-3.5 h-3.5 ${isPro ? 'text-white' : 'text-slate-500'}`} strokeWidth={4} />
            </div>
        )
    }

    if (value === false || value === "—" || value === null) {
        return (
            <div className="flex items-center justify-center w-6 h-6">
                <Minus className="text-zinc-200" size={14} />
            </div>
        )
    }

    // Handle v2/v3 badges
    const renderValue = (val: string) => {
        const match = val.match(/(v\d)/i)
        if (match) {
            const version = match[0].toUpperCase()
            const text = val.replace(match[0], '').trim().replace(/\(|\)/g, '')
            return (
                <div className="flex items-center gap-2">
                    {text && <span className={`text-[13px] font-black tracking-tight ${isPro ? 'text-emerald-700' : 'text-zinc-600'}`}>{text}</span>}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-sm animate-pulse-slow">
                        <Clock size={8} strokeWidth={3} />
                        {version}
                    </div>
                </div>
            )
        }
        return <span className={`text-[13px] font-black tracking-tight ${isPro ? 'text-emerald-700' : 'text-zinc-600'}`}>{val}</span>
    }

    if (typeof value === "string") {
        return renderValue(value)
    }

    return null
}
