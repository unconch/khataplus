"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react"
import { Navbar } from "./Navbar"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

interface HeroSectionProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
    const primaryHref = isAuthenticated ? "/dashboard" : "/auth/sign-up"
    const secondaryHref = "/demo"

    return (
        <>
            <Navbar isAuthenticated={isAuthenticated} />

            <section className="relative min-h-[108svh] md:min-h-[104svh] overflow-hidden bg-[#0f4ad3] text-white">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,#67dcff_0%,rgba(103,220,255,0.2)_26%,transparent_56%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(157,234,255,0.95)_0%,rgba(24,118,255,0.3)_30%,transparent_65%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(102deg,#0b2b92_0%,#1b65f1_48%,#66d4ff_100%)] opacity-85" />
                    <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-18 pb-14 md:pt-22 md:pb-20">
                    <div className="grid gap-7 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                        <div>
                            <AdvancedScrollReveal variant="slideUp" delay={100}>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-lg">
                                    <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                                    Made for Indian shops and distributors
                                </div>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={220}>
                                <h1 className="mt-4 max-w-2xl text-[2.35rem] font-extrabold leading-[1.08] tracking-tight md:text-6xl lg:text-[3.45rem]">
                                    GST billing & khata
                                    <br className="hidden sm:block" />
                                    in one fast app
                                </h1>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={340}>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-50/90 md:text-lg">
                                    Raise invoices in seconds, track stock live, and collect payments faster—always in sync on mobile and desktop.
                                </p>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={430}>
                                <div className="mt-5 space-y-2">
                                    {[
                                        "GST-ready invoices with auto tax totals",
                                        "Smart payment reminders over WhatsApp",
                                        "Live stock, khata, and sales analytics",
                                    ].map((item) => (
                                        <div key={item} className="flex items-center gap-2.5 text-sm text-blue-50 md:text-base">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300 md:h-4 md:w-4" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={560}>
                                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Link
                                        href={primaryHref}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,0,0,0.85)] transition hover:bg-slate-800 md:px-7 md:py-3.5"
                                    >
                                        Start Free Trial
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href={secondaryHref}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/55 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-lg transition hover:bg-white/18 md:px-7 md:py-3.5"
                                    >
                                        <Play className="h-4 w-4 fill-white stroke-0" />
                                        Watch Demo
                                    </Link>
                                </div>
                            </AdvancedScrollReveal>

                        </div>

                        <AdvancedScrollReveal variant="slideLeft" delay={280} className="relative hidden lg:block">
                            <div className="visual-stack">
                                <div className="dash-frame">
                                    <div className="dash-sidebar">
                                        <div className="dash-logo">KP</div>
                                        {["Home","Sales","Inventory","Analytics","Reports","Organization"].map((item, idx) => (
                                            <div key={item} className={`dash-nav ${idx===0 ? "active":""}`}>
                                                <span className="dot bullet" /> {item}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="dash-main">
                                        <div className="dash-topbar">
                                            <div className="dash-breadcrumb">KhataPlus</div>
                                            <div className="dash-search">Search Command</div>
                                            <div className="dash-user">kong</div>
                                        </div>
                                        <div className="dash-banner">
                                            <span>Complete your business profile to enable professional GST invoices</span>
                                            <button>Setup profile</button>
                                        </div>
                                        <div className="dash-greeting">
                                            <p>My business</p>
                                            <h3>Good evening, kong 👋</h3>
                                            <div className="dash-meta">Friday, Feb 20, 2026 · Live sync</div>
                                        </div>
                                        <div className="dash-quick">
                                            <div className="quick-card"><span className="icon">＋</span><div><strong>New Sale</strong><small>Record daily income</small></div></div>
                                            <div className="quick-card"><span className="icon">$</span><div><strong>New Invoice</strong><small>Generate billing</small></div></div>
                                            <div className="quick-card"><span className="icon">⬆</span><div><strong>Add Stock</strong><small>Update inventory</small></div></div>
                                            <div className="quick-card"><span className="icon">👥</span><div><strong>Add Customer</strong><small>Expand ledger</small></div></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="phone-card phone-right">
                                    <div className="phone-glow" />
                                    <div className="phone-shell">
                                        <div className="phone-top">
                                            <div className="phone-avatar">K</div>
                                            <div>
                                                <div className="phone-hello">Hello, kong</div>
                                                <div className="phone-sub">Owner · Live sync</div>
                                            </div>
                                        </div>
                                        <div className="phone-cards">
                                            <div className="mini-card">
                                                <span className="mini-label">Sales today</span>
                                                <strong className="mini-value">₹18,250</strong>
                                                <span className="mini-trend up">+12% vs yesterday</span>
                                            </div>
                                            <div className="mini-card">
                                                <span className="mini-label">Invoices</span>
                                                <strong className="mini-value">12</strong>
                                                <span className="mini-sub">Due: 3 · Paid: 9</span>
                                            </div>
                                            <div className="mini-card">
                                                <span className="mini-label">Low stock</span>
                                                <strong className="mini-value warn">6</strong>
                                                <span className="mini-sub">Restock soon</span>
                                            </div>
                                            <div className="mini-card">
                                                <span className="mini-label">Customers</span>
                                                <strong className="mini-value">842</strong>
                                                <span className="mini-sub">+18 this week</span>
                                            </div>
                                        </div>
                                        <div className="phone-footer">Quick tip: Send invoices via WhatsApp instantly</div>
                                    </div>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>

                <div className="pointer-events-none absolute -bottom-4 left-[-8%] h-9 w-[24%] rotate-[-8deg] bg-emerald-300/95" />
                <div className="pointer-events-none absolute -bottom-2 right-[-8%] h-8 w-[26%] rotate-[7deg] bg-blue-800/85" />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white/95" />

                <div className="absolute bottom-14 left-0 right-0 h-7 z-20 pointer-events-none">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" preserveAspectRatio="none">
                        <path d="M0 90C210 48 430 106 694 83C945 62 1185 36 1440 74" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.5" />
                    </svg>
                </div>

                <div className="absolute bottom-7 left-0 right-0 h-8 z-20 pointer-events-none">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" preserveAspectRatio="none">
                        <path d="M0 84C236 28 438 110 703 78C949 48 1176 24 1440 66" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.95" />
                    </svg>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-10 z-10 pointer-events-none">
                    <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0 200L1440 200V25C1245 95 981 137 709 137C434 137 181 90 0 16V200Z" fill="white" />
                    </svg>
                </div>

                <style jsx global>{`
                    .visual-stack {
                        position: relative;
                        width: 740px;
                        height: 460px;
                        margin-inline: auto;
                        transform: translateY(-18px);
                        perspective: 1400px;
                        transform-style: preserve-3d;
                    }
                    .visual-stack::before {
                        content: "";
                        position: absolute;
                        inset: 6%;
                        background: radial-gradient(circle at 30% 30%, rgba(59,130,246,0.25), transparent 55%),
                                    radial-gradient(circle at 70% 60%, rgba(16,185,129,0.22), transparent 60%);
                        filter: blur(38px);
                        z-index: -1;
                        transform: translateZ(-60px);
                    }
                    .dash-frame {
                        position: absolute;
                        left: 0;
                        top: 2%;
                        width: 92%;
                        height: 330px;
                        background: linear-gradient(180deg, #0f172a 0%, #0b1224 40%, #0b1224 100%);
                        border-radius: 24px;
                        overflow: hidden;
                        border: 1px solid rgba(255,255,255,0.08);
                        box-shadow: 0 38px 80px -32px rgba(0,0,0,0.7);
                        display: grid;
                        grid-template-columns: 170px 1fr;
                        transform: rotateY(-6deg) rotateX(4deg);
                    }
                    .dash-sidebar {
                        color: #e2e8f0;
                        padding: 18px 14px;
                        display: grid;
                        gap: 10px;
                        background: #0b1224;
                    }
                    .dash-logo {
                        width: 46px;
                        height: 46px;
                        border-radius: 12px;
                        background: #111827;
                        display: grid;
                        place-items: center;
                        font-weight: 800;
                        letter-spacing: 0.02em;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
                    }
                    .dash-nav {
                        padding: 10px 12px;
                        border-radius: 10px;
                        font-weight: 600;
                        color: #cbd5e1;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: background 0.2s ease, color 0.2s ease;
                    }
                    .dash-nav.active {
                        background: #111827;
                        color: #f8fafc;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
                    }
                    .dot.bullet {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: #22c55e;
                        display: inline-block;
                    }
                    .dash-main {
                        background: linear-gradient(180deg, #0f172a 0%, #0b1224 100%);
                        padding: 14px 16px;
                        color: #e2e8f0;
                        display: grid;
                        gap: 10px;
                        position: relative;
                    }
                    .dash-topbar {
                        display: grid;
                        grid-template-columns: 1fr auto auto;
                        gap: 8px;
                        align-items: center;
                        font-size: 12px;
                        opacity: 0.9;
                    }
                    .dash-search {
                        background: #0b1224;
                        border-radius: 999px;
                        padding: 6px 12px;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
                    }
                    .dash-user {
                        background: #111827;
                        padding: 6px 10px;
                        border-radius: 10px;
                        font-weight: 700;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
                    }
                    .dash-breadcrumb {
                        font-weight: 700;
                        letter-spacing: 0.02em;
                    }
                    .dash-banner {
                        background: #eaf2ff;
                        color: #0b1224;
                        border-radius: 12px;
                        padding: 10px 12px;
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        box-shadow: inset 0 0 0 1px rgba(37,99,235,0.12);
                    }
                    .dash-banner button {
                        background: #2563eb;
                        color: #fff;
                        border: none;
                        border-radius: 8px;
                        padding: 6px 10px;
                        font-weight: 700;
                        cursor: pointer;
                    }
                    .dash-greeting h3 {
                        margin: 6px 0 2px;
                        font-size: 26px;
                        font-weight: 900;
                    }
                    .dash-greeting p { margin: 0; font-size: 11px; letter-spacing: 0.2px; opacity: 0.8; text-transform: uppercase; }
                    .dash-meta { font-size: 11px; color: #9ca3af; }
                    .dash-quick {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 10px;
                        margin-top: 10px;
                    }
                    .quick-card {
                        background: #0b1224;
                        border-radius: 12px;
                        padding: 12px;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 12px 30px -24px rgba(0,0,0,0.6);
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #e2e8f0;
                    }
                    .quick-card .icon {
                        width: 20px;
                        height: 20px;
                        display: grid;
                        place-items: center;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.08);
                        font-weight: 800;
                    }
                    .phone-card {
                        position: absolute;
                        right: -12%;
                        bottom: -12%;
                        width: 230px;
                        transform: rotateZ(12deg) rotateY(-3deg) translateZ(70px);
                        animation: phone-float 6s ease-in-out infinite;
                    }
                    .phone-card.phone-right {
                        right: -6%;
                        bottom: -6%;
                    }
                    .phone-glow {
                        position: absolute;
                        inset: 8%;
                        background: radial-gradient(circle at 40% 30%, rgba(16,185,129,0.35), transparent 60%);
                        filter: blur(24px);
                        transform: translateZ(-10px);
                    }
                    .phone-card .phone-img {
                        border-radius: 26px;
                        border: 1px solid rgba(255,255,255,0.2);
                        box-shadow: 0 24px 44px -24px rgba(0,0,0,0.75);
                        width: 100%;
                        height: 360px;
                        object-fit: cover;
                        background: #0b1224;
                    }
                    .phone-shell {
                        background: linear-gradient(180deg, #0ea5e9, #22c55e);
                        color: #f8fafc;
                        border-radius: 24px;
                        padding: 16px;
                        min-height: 360px;
                        box-shadow: 0 24px 46px -24px rgba(0,0,0,0.8);
                        display: grid;
                        gap: 10px;
                    }
                    .phone-top {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-weight: 800;
                        font-size: 15px;
                    }
                    .phone-avatar {
                        width: 34px;
                        height: 34px;
                        border-radius: 12px;
                        background: rgba(0,0,0,0.18);
                        display: grid;
                        place-items: center;
                        font-weight: 900;
                        font-size: 14px;
                    }
                    .phone-hello { font-size: 14px; font-weight: 800; }
                    .phone-sub { font-size: 11px; opacity: 0.8; }
                    .phone-cards {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }
                    .mini-card {
                        background: rgba(255,255,255,0.14);
                        border-radius: 12px;
                        padding: 10px;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
                    }
                    .mini-label { font-size: 11px; opacity: 0.85; display: block; }
                    .mini-value { font-size: 18px; font-weight: 900; display: block; margin-top: 2px; }
                    .mini-value.warn { color: #fffbeb; }
                    .mini-trend { font-size: 11px; font-weight: 700; }
                    .mini-trend.up { color: #bbf7d0; }
                    .mini-sub { font-size: 11px; opacity: 0.85; }
                    .phone-footer { font-size: 11px; opacity: 0.85; }
                    .phone-shell .phone-img { display: none; }
                    }
                    @keyframes phone-float {
                        0%,100% { transform: rotateZ(12deg) rotateY(-3deg) translateY(0) translateZ(70px); }
                        50% { transform: rotateZ(10deg) rotateY(-1deg) translateY(-14px) translateZ(70px); }
                    }
                    @media (max-width: 1024px) {
                        .visual-stack { display: none; }
                    }
                `}</style>
            </section>
        </>
    )
}
