"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, LazyMotion, domAnimation, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import {
    ArrowRight,
    Menu,
    X,
    Check,
    Sparkles,
    Receipt,
    Users,
    BarChart3,
    Wallet,
    MapPin
} from "lucide-react"

// Animation Components & Hooks
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { ScrollProgressBar } from "@/components/scroll-progress-bar"
import { MagneticButton } from "@/components/magnetic-button"
import { SplitText } from "@/components/split-text"
import { GradientText } from "@/components/gradient-text"
import { BentoGrid, BentoCard } from "@/components/bento-grid"
import { useParallax } from "@/hooks/use-parallax"
import { useMouseParallax } from "@/hooks/use-mouse-parallax"
import { ShieldCheck, WifiOff, FileText, TrendingUp, Monitor, Smartphone, Zap, Shield } from "lucide-react"

export function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeTab, setActiveTab] = useState<"desktop" | "pwa">("desktop")
    // Removed pageLoaded state to improve LCP - background renders immediately

    // Parallax & Mouse Effects
    const heroParallax = useParallax(150) // Background moves slower
    const mousePos = useMouseParallax(0.015) // Subtle cursor follow

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-white text-zinc-900 antialiased overflow-x-hidden text-lg selection:bg-emerald-500/30">
                <ScrollProgressBar />

                {/* Navigation */}
                <motion.nav
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? "bg-white/90 backdrop-blur-lg border-b border-zinc-200/80 shadow-sm"
                        : "bg-transparent"
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}>
                                <Logo size={32} className={scrolled ? "text-emerald-600" : "text-white"} />
                            </motion.div>
                            <span className={`font-bold text-xl tracking-tight ${scrolled ? "text-zinc-900" : "text-white"}`}>KhataPlus</span>
                            <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-1 rounded animate-pulse">BETA</span>
                        </Link>

                        <div className={`hidden md:flex items-center gap-10 text-base font-medium ${scrolled ? "text-zinc-600" : "text-white/90"}`}>
                            <NavLink href="#features" label="Features" />
                            <NavLink href="#how" label="How it works" />
                            <NavLink href="#pricing" label="Pricing" />
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <Link href="/auth/login">
                                <Button variant="ghost" size="lg" className={`text-base hover:scale-105 transition-transform ${scrolled ? "text-zinc-600 hover:text-zinc-900" : "text-white hover:bg-white/10"}`}>
                                    Sign in
                                </Button>
                            </Link>
                            <Link href="/auth/sign-up">
                                <MagneticButton>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 py-3 text-base font-medium shadow-lg shadow-emerald-500/20"
                                    >
                                        Start Free
                                    </motion.button>
                                </MagneticButton>
                            </Link>
                        </div>

                        <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen
                                ? <X size={28} className={scrolled ? "text-zinc-900" : "text-white"} />
                                : <Menu size={28} className={scrolled ? "text-zinc-900" : "text-white"} />
                            }
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-zinc-100 shadow-xl"
                        >
                            <div className="px-6 py-5 space-y-2">
                                <a href="#features" className="block px-4 py-3 text-lg text-zinc-700 font-medium rounded-xl hover:bg-zinc-50" onClick={() => setMobileMenuOpen(false)}>Features</a>
                                <a href="#how" className="block px-4 py-3 text-lg text-zinc-700 font-medium rounded-xl hover:bg-zinc-50" onClick={() => setMobileMenuOpen(false)}>How it works</a>
                                <a href="#pricing" className="block px-4 py-3 text-lg text-zinc-700 font-medium rounded-xl hover:bg-zinc-50" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                            </div>
                            <div className="border-t border-zinc-100 px-6 py-5 space-y-4">
                                <Link href="/auth/login" className="block text-center py-3 text-lg text-zinc-900 font-semibold">Sign in</Link>
                                <Link href="/auth/sign-up" className="block">
                                    <Button size="lg" className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg">Start Free</Button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </motion.nav>

                {/* Hero */}
                <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
                    {/* Parallax Background */}
                    <motion.div style={{ y: heroParallax }} className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
                        <div className="absolute inset-0 opacity-[0.08]" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }} />
                    </motion.div>

                    {/* Floating Shapes with Mouse Parallax */}
                    <motion.div style={{ x: mousePos.x, y: mousePos.y }} className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-1/4 left-[5%] w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-slow" />
                        <div className="absolute bottom-1/4 right-[5%] w-96 h-96 bg-teal-300/15 rounded-full blur-3xl animate-float-slower" />
                    </motion.div>

                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
                        {/* Badge */}
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-base font-medium border border-white/25 mb-10 hover:bg-white/30 transition-colors cursor-default">
                                <Sparkles size={16} className="text-amber-300" />
                                <span>Early Access</span>
                            </div>
                        </AdvancedScrollReveal>

                        {/* Headline */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-8 tracking-tight drop-shadow-sm">
                            <SplitText text="Run your shop" className="block" delay={0.2} />
                            <span className="text-emerald-200 inline-block hover:scale-105 transition-transform duration-300 cursor-default">
                                <SplitText text="like a pro." delay={0.6} />
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <AdvancedScrollReveal variant="fadeIn" delay={800}>
                            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
                                Billing, inventory, and credit management — all in one simple app.
                            </p>
                        </AdvancedScrollReveal>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <AdvancedScrollReveal variant="slideLeft" delay={1000}>
                                <Link href="/auth/sign-up" className="w-full sm:w-auto">
                                    <MagneticButton className="w-full sm:w-auto">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="w-full sm:w-auto h-16 px-10 bg-white text-emerald-700 hover:bg-emerald-50 rounded-full text-xl font-semibold shadow-xl group flex items-center justify-center gap-2"
                                        >
                                            Get Started Free
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </motion.button>
                                    </MagneticButton>
                                </Link>
                            </AdvancedScrollReveal>
                            <AdvancedScrollReveal variant="slideRight" delay={1200}>
                                <Link href="/auth/login" className="w-full sm:w-auto">
                                    <Button size="lg" variant="ghost" className="w-full sm:w-auto h-16 px-8 text-white text-xl border-2 border-white/30 hover:bg-white/10 rounded-full hover:border-white transition-all">
                                        Sign in
                                    </Button>
                                </Link>
                            </AdvancedScrollReveal>
                        </div>


                    </div>

                    {/* Wave Divider */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 z-10 pointer-events-none">
                        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0 100L60 90C120 80 240 60 360 50C480 40 600 40 720 45C840 50 960 60 1080 65C1200 70 1320 70 1380 70L1440 70V100H0V100Z" fill="white" />
                        </svg>
                    </div>
                </section>


                {/* Features */}
                <section id="features" className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <AdvancedScrollReveal variant="slideUp">
                            <div className="text-center mb-16 md:mb-20">
                                <span className="text-emerald-600 font-semibold text-sm tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full">Features</span>
                                <div className="mt-4 flex justify-center">
                                    <GradientText className="text-4xl md:text-5xl lg:text-6xl font-bold" colors={["#059669", "#0d9488", "#d97706", "#059669"]}>
                                        Everything your shop needs
                                    </GradientText>
                                </div>
                                <p className="text-zinc-500 text-xl max-w-2xl mx-auto mt-4">
                                    From billing to inventory — all in one simple app.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <BentoGrid className="md:grid-rows-2">
                            {/* Card 1: Offline Mode */}
                            <BentoCard
                                name="Works Offline"
                                className="col-span-1 lg:col-span-1"
                                Icon={WifiOff}
                                description="No internet? No problem. Create entries anytime, sync when you're back online."
                                href="#offline"
                                cta="Learn more"
                                background={
                                    <div className="absolute top-10 right-10 opacity-40">
                                        <div className="bg-zinc-100 rounded-lg p-2 transform rotate-6 border border-zinc-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                                <span className="text-xs text-zinc-500 font-mono">DISCONNECTED</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            />
                            {/* Card 2: Analytics */}
                            <BentoCard
                                name="Smart Analytics"
                                className="col-span-1 lg:col-span-2"
                                Icon={TrendingUp}
                                description="Deep insights into your daily sales, credit, and inventory turnover. Know your business pulse."
                                href="#analytics"
                                cta="View Reports"
                                background={
                                    <div className="absolute bottom-0 right-0 w-3/4 opacity-20">
                                        <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-emerald-500">
                                            <path d="M0 100 V 80 Q 50 20 100 50 T 200 10 V 100 Z" />
                                        </svg>
                                    </div>
                                }
                            />
                            {/* Card 3: Secure */}
                            <BentoCard
                                name="Bank-Grade Security"
                                className="col-span-1 lg:col-span-1"
                                Icon={ShieldCheck}
                                description="Your data is encrypted and safe. Daily backups ensure you never lose a single entry."
                                href="#security"
                                cta="Security Specs"
                                background={
                                    <div className="absolute -right-6 -top-6 text-emerald-100 opacity-50">
                                        <ShieldCheck size={180} />
                                    </div>
                                }
                            />
                            {/* Card 4: GST Ready */}
                            <BentoCard
                                name="GST Invoices"
                                className="col-span-1 lg:col-span-2"
                                Icon={FileText}
                                description="Generate professional GST-compliant tax invoices and share directly via WhatsApp."
                                href="#gst"
                                cta="See Templates"
                                background={
                                    <div className="absolute top-8 right-8 w-40 h-56 bg-white border border-zinc-100 shadow-lg rounded-md p-3 opacity-60 transform rotate-3">
                                        <div className="h-2 w-12 bg-zinc-200 rounded mb-2" />
                                        <div className="space-y-1">
                                            <div className="h-1 w-full bg-zinc-100 rounded" />
                                            <div className="h-1 w-full bg-zinc-100 rounded" />
                                            <div className="h-1 w-2/3 bg-zinc-100 rounded" />
                                        </div>
                                    </div>
                                }
                            />
                        </BentoGrid>
                    </div>
                </section>

                {/* Infrastructure Section */}
                <section className="py-24 bg-zinc-900 overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="slideRight">
                                    <span className="text-emerald-400 font-semibold text-sm tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full">Infrastructure</span>
                                    <h2 className="text-3xl md:text-5xl font-bold text-white mt-6 mb-6">Built for scale,<br />designed for speed.</h2>
                                    <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                                        Our architecture handles millions of transactions with sub-millisecond latency. Whether you're a small shop or a retail chain, we grow with you.
                                    </p>

                                    <div className="space-y-4">
                                        {[
                                            { title: "Zero Downtime", desc: "Redundant systems ensure 99.99% uptime." },
                                            { title: "End-to-End Encryption", desc: "AES-256 encryption for all your financial data." },
                                            { title: "Real-time Sync", desc: "Changes reflect instantly across all devices." }
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Check size={14} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-medium">{item.title}</h4>
                                                    <p className="text-zinc-500 text-sm">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AdvancedScrollReveal>
                            </div>

                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="scaleUp">
                                    {/* Hero Visualization Reused Here */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 1 }}
                                        className="relative w-full aspect-square md:aspect-video group"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                        <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm shadow-2xl">
                                            <Image
                                                src="/images/hero-viz.png"
                                                alt="Visualization"
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>

                                            {/* Floating Interactive Elements */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-20" />
                                                </div>
                                            </div>

                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                whileInView={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                className="absolute bottom-6 right-6 p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 max-w-[200px] hover:bg-white/20 transition-colors shadow-lg"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Shield className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Secured</span>
                                                </div>
                                                <div className="text-xs text-zinc-300">Enterprise Grade Security Protocol Active</div>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                </AdvancedScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section id="how" className="py-24 md:py-32 px-6 bg-zinc-50 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto relative z-10">
                        <AdvancedScrollReveal variant="fadeIn">
                            <div className="text-center mb-16 md:mb-20">
                                <span className="text-emerald-600 font-semibold text-sm tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full">How It Works</span>
                                <div className="mt-4 flex justify-center">
                                    <GradientText className="text-4xl md:text-5xl lg:text-6xl font-bold" colors={["#059669", "#0d9488", "#2563eb", "#059669"]}>
                                        Simple as 1-2-3
                                    </GradientText>
                                </div>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                            <AdvancedScrollReveal delay={0} variant="slideLeft">
                                <StepCard number="1" title="Sign Up Free" description="Create your account in 30 seconds." color="emerald" />
                            </AdvancedScrollReveal>
                            <AdvancedScrollReveal delay={300} variant="slideUp">
                                <StepCard number="2" title="Add Products" description="Set up inventory quickly." color="amber" />
                            </AdvancedScrollReveal>
                            <AdvancedScrollReveal delay={600} variant="slideRight">
                                <StepCard number="3" title="Start Selling" description="Create bills & track sales." color="blue" />
                            </AdvancedScrollReveal>
                        </div>
                    </div>
                </section>

                {/* Adaptive Interface (PWA vs Desktop) */}
                <section className="py-24 md:py-32 px-6 bg-zinc-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }} />

                    <div className="container mx-auto relative z-10">
                        <div className="text-center mb-16">
                            <span className="text-emerald-400 font-semibold text-sm tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full">Adaptive Interface</span>
                            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">Experience Flexibility</h2>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setActiveTab("desktop")}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${activeTab === "desktop" ? "bg-white text-black shadow-lg scale-105" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                                >
                                    <Monitor className="w-5 h-5" /> Desktop UI
                                </button>
                                <button
                                    onClick={() => setActiveTab("pwa")}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${activeTab === "pwa" ? "bg-white text-black shadow-lg scale-105" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                                >
                                    <Smartphone className="w-5 h-5" /> PWA Mobile
                                </button>
                            </div>
                        </div>

                        <div className="max-w-6xl mx-auto">
                            <div className="relative bg-gradient-to-br from-white/5 to-white/0 rounded-3xl border border-white/10 p-1 md:p-4 backdrop-blur-2xl">
                                <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-[#0F0F0F] flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        {activeTab === "desktop" ? (
                                            <motion.div
                                                key="desktop"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className="w-full h-full flex"
                                            >
                                                {/* Desktop Mockup */}
                                                <div className="w-64 h-full border-r border-white/10 bg-white/5 flex flex-col p-4 gap-4 hidden md:flex">
                                                    <div className="w-32 h-8 bg-white/10 rounded-md animate-pulse" />
                                                    <div className="space-y-2 mt-4">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className="w-full h-10 bg-white/5 rounded-lg" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-6 grid grid-cols-3 gap-6">
                                                    <div className="col-span-2 h-64 bg-white/5 rounded-xl border border-white/10 p-4 relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
                                                        <div className="relative z-10">
                                                            <div className="w-1/3 h-6 bg-white/10 rounded mb-4" />
                                                            <div className="w-full h-32 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-lg mt-8" />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 space-y-4">
                                                        <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
                                                        <div className="h-28 bg-white/5 rounded-xl border border-white/10" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="pwa"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className="w-full h-full flex flex-col items-center justify-center p-8"
                                            >
                                                {/* Mobile PWA Mockup Frame */}
                                                <div className="w-[300px] h-[550px] border-4 border-white/10 rounded-[3rem] bg-black relative overflow-hidden shadow-2xl scale-75 md:scale-100 origin-center">
                                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                                                    <div className="h-full w-full bg-[#111] flex flex-col relative">
                                                        <div className="flex-1 p-4 space-y-4 overflow-y-auto pt-12 no-scrollbar">
                                                            <div className="h-40 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-2xl border border-white/5 p-4">
                                                                <div className="w-16 h-16 rounded-full bg-white/10 mb-2" />
                                                                <div className="w-2/3 h-4 bg-white/10 rounded" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                {[1, 2, 3].map(i => (
                                                                    <div key={i} className="h-16 bg-white/5 rounded-xl flex items-center px-4 gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-white/10" />
                                                                        <div className="flex-1 h-3 bg-white/10 rounded" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="h-16 bg-white/5 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-4">
                                                            <div className="w-6 h-6 rounded bg-emerald-400/50" />
                                                            <div className="w-6 h-6 rounded bg-white/20" />
                                                            <div className="w-6 h-6 rounded bg-white/20" />
                                                            <div className="w-6 h-6 rounded bg-white/20" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mt-8 grid md:grid-cols-2 gap-8">
                                <div className={`p-6 rounded-2xl border border-white/10 transition-all duration-300 ${activeTab === 'desktop' ? 'bg-white/10' : 'bg-transparent opacity-50'}`}>
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Monitor className="w-5 h-5 text-emerald-400" /> Desktop Power</h3>
                                    <p className="text-gray-400">Full-featured dashboard with multi-pane layouts, deep analytics, and administrative controls optimized for productivity on large screens.</p>
                                </div>
                                <div className={`p-6 rounded-2xl border border-white/10 transition-all duration-300 ${activeTab === 'pwa' ? 'bg-white/10' : 'bg-transparent opacity-50'}`}>
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Smartphone className="w-5 h-5 text-teal-400" /> Mobile Agility</h3>
                                    <p className="text-gray-400">Installable PWA that feels like a native app. Optimized touch interactions, offline capabilities, and focused views for field work.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="py-24 md:py-32 px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-base font-semibold mb-6">
                                <Sparkles size={16} />
                                BETA OFFER
                            </div>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                                Free for <span className="text-emerald-600">founding members</span>
                            </h2>
                            <p className="text-zinc-500 text-xl mb-12">
                                Join beta and get lifetime free access.
                            </p>

                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-10 md:p-12 text-white shadow-xl shadow-emerald-500/20 mx-auto relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 p-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                                <p className="text-emerald-100 text-lg font-medium mb-2 relative z-10">Beta Access</p>
                                <div className="text-6xl font-bold mb-3 relative z-10 flex items-center justify-center gap-1">
                                    <span>₹</span>
                                    <Counter from={999} to={0} duration={2} />
                                </div>
                                <p className="text-emerald-100 text-lg mb-8 relative z-10">Forever, for early adopters</p>
                                <Link href="/auth/sign-up" className="relative z-10 block">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full h-16 bg-white text-emerald-700 hover:bg-emerald-50 rounded-full text-xl font-bold shadow-lg flex items-center justify-center"
                                    >
                                        Claim Your Spot
                                    </motion.button>
                                </Link>
                                <p className="text-emerald-200/80 text-base mt-5 relative z-10 animate-pulse">
                                    Limited spots available
                                </p>
                            </motion.div>
                        </AdvancedScrollReveal>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-zinc-900 text-white py-12 md:py-16 px-6 border-t border-zinc-800">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Logo size={32} className="text-emerald-400" />
                                <span className="font-bold text-xl">KhataPlus</span>
                            </div>
                            <div className="flex gap-8 text-base text-zinc-400">
                                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms</a>
                                <a href="#" className="hover:text-white transition-colors">Contact</a>
                            </div>
                            <div className="flex items-center gap-3 text-base text-zinc-500">
                                <span>© 2026 KhataPlus</span>
                                <span className="text-zinc-600">•</span>
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} /> Made in Northeast
                                </span>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Global Animations CSS */}
                <style jsx global>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, -20px); }
                }
                @keyframes float-slower {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-25px, 25px); }
                }
                .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
                .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
            `}</style>
            </div >
        </LazyMotion >
    )
}

function NavLink({ href, label }: { href: string, label: string }) {
    return (
        <a href={href} className="relative group overflow-hidden py-1">
            <span className="hover:text-emerald-500 transition-colors">{label}</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        </a>
    )
}

function FeatureCard({ icon: Icon, title, description, color }: {
    icon: any
    title: string
    description: string
    color: string
}) {
    const colorMap: Record<string, { bg: string, icon: string, border: string }> = {
        emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
        amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
        blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
        violet: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
    }

    const c = colorMap[color]

    return (
        <motion.div
            whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
            className={`${c.bg} ${c.border} border rounded-3xl p-6 md:p-8 transition-all duration-300 cursor-default group`}
        >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Icon size={28} className={c.icon} />
            </div>
            <h3 className="font-bold text-xl md:text-2xl mb-2 group-hover:text-zinc-900 transition-colors">{title}</h3>
            <p className="text-zinc-500 text-base md:text-lg group-hover:text-zinc-600 transition-colors">{description}</p>
        </motion.div>
    )
}

function StepCard({ number, title, description, color }: {
    number: string
    title: string
    description: string
    color: string
}) {
    const colorMap: Record<string, { bg: string, text: string }> = {
        emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
        amber: { bg: "bg-amber-100", text: "text-amber-600" },
        blue: { bg: "bg-blue-100", text: "text-blue-600" },
    }

    const c = colorMap[color]

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-zinc-100 group relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${c.bg} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

            <div className={`w-16 h-16 md:w-20 md:h-20 ${c.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10`}>
                <span className={`text-3xl md:text-4xl font-bold ${c.text}`}>{number}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 relative z-10">{title}</h3>
            <p className="text-zinc-500 text-lg relative z-10">{description}</p>

            {/* Connecting Line (for desktop) */}
            <div className="hidden md:block absolute top-1/2 -right-8 w-16 h-0.5 bg-gradient-to-r from-zinc-200 to-transparent z-0" />
        </motion.div>
    )
}

function Counter({ from, to, duration }: { from: number, to: number, duration: number }) {
    const nodeRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const node = nodeRef.current
        if (!node) return

        const controls = { value: from }
        // Simple manual animation for number for now since animate() is complex to type here
        // In real Framer Motion 10+ we use animate(source, dest, options)
        // using simple CSS transition approach fallback or basic set for now
        let start = Date.now()
        let timer = setInterval(() => {
            let time = Date.now() - start
            let progress = Math.min(time / (duration * 1000), 1)
            let current = Math.floor(from + (to - from) * progress)
            node.textContent = current.toString()
            if (progress >= 1) clearInterval(timer)
        }, 16)

        return () => clearInterval(timer)
    }, [from, to, duration])

    return <span ref={nodeRef} />
}
