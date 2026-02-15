"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, LazyMotion, domAnimation, AnimatePresence, useInView } from "framer-motion"
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
    MapPin,
    Play
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
import { ShieldCheck, WifiOff, FileText, TrendingUp, Monitor, Smartphone, Zap, Shield, Star, Package, ArrowUpRight, IndianRupee, Calculator, Tag } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <a href={href} className="relative group overflow-hidden py-1">
            <span className="hover:text-emerald-500 transition-colors">{label}</span>
        </a>
    )
}

function FeatureCard({ icon: Icon, title, description, color }: {
    icon: any
    title: string
    description: string
    color: string
}) {
    const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
        emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
        amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
        blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
        violet: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
    }

    const c = colorMap[color]

    return (
        <motion.div
            whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
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
    const colorMap: Record<string, { bg: string; text: string }> = {
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

function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
    const nodeRef = useRef<HTMLSpanElement>(null)
    const isInView = useInView(nodeRef, { once: true, amount: 0.3 })

    useEffect(() => {
        if (!isInView) {
            return
        }

        const node = nodeRef.current
        if (!node) {
            return
        }

        let start = Date.now()
        let timer = setInterval(() => {
            let time = Date.now() - start
            let progress = Math.min(time / (duration * 1000), 1)
            let current = Math.floor(from + (to - from) * progress)
            node.textContent = current.toString()
            if (progress >= 1) {
                clearInterval(timer)
            }
        }, 16)

        return () => clearInterval(timer)
    }, [from, to, duration, isInView])

    return <span ref={nodeRef}>{from}</span>
}

export function LandingPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeTab, setActiveTab] = useState<"desktop" | "pwa">("desktop")

    const supabase = createClient()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setIsAuthenticated(!!session)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

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
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                        ? "bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl border-b border-white/20 dark:border-zinc-800/20 shadow-xl shadow-black/5"
                        : "bg-transparent"
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}>
                                <Logo size={36} className={scrolled ? "text-emerald-600" : "text-white"} />
                            </motion.div>
                            <span className={`font-black text-2xl tracking-tighter ${scrolled ? "text-zinc-900" : "text-white"}`}>KhataPlus</span>
                            <span className="text-[10px] font-black bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded shadow-lg shadow-emerald-400/20">PIONEER ACCESS</span>
                        </Link>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } }
                            }}
                            className={`hidden lg:flex items-center gap-10 text-sm font-bold tracking-tight ${scrolled ? "text-zinc-600" : "text-white/90"}`}
                        >
                            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}><NavLink href="#features" label="Features" /></motion.div>
                            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}><NavLink href="#pricing" label="Pricing" /></motion.div>
                            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}><Link href="/tools/gst-calculator" className="hover:text-emerald-500 transition-colors">GST Tool</Link></motion.div>
                            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}><Link href="/tools/business-card" className="hover:text-emerald-500 transition-colors">Card Maker</Link></motion.div>
                            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}><a href="/demo" className="font-black text-emerald-400 hover:text-emerald-300 transition-colors">Demo</a></motion.div>
                        </motion.div>

                        <div className="hidden md:flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link href="/dashboard">
                                    <MagneticButton>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 py-3 text-base font-medium shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                        >
                                            Dashboard
                                            <ArrowRight className="h-4 w-4" />
                                        </motion.button>
                                    </MagneticButton>
                                </Link>
                            ) : (
                                <>
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
                                                Join Early Member Program
                                            </motion.button>
                                        </MagneticButton>
                                    </Link>
                                </>
                            )}
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
                                <a href="#pricing" className="block px-4 py-3 text-lg text-zinc-700 font-medium rounded-xl hover:bg-zinc-50" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                            </div>
                            <div className="border-t border-zinc-100 px-6 py-5 space-y-4">
                                {isAuthenticated ? (
                                    <Link href="/dashboard" className="block">
                                        <Button size="lg" className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg">Dashboard</Button>
                                    </Link>
                                ) : (
                                    <>
                                        <a href="/demo" className="w-full block text-center py-3 text-lg text-emerald-600 font-bold hover:bg-emerald-50 rounded-xl transition-colors">
                                            View Demo
                                        </a>
                                        <Link href="/auth/login" className="block text-center py-3 text-lg text-zinc-900 font-semibold">Sign in</Link>
                                        <Link href="/auth/sign-up" className="block">
                                            <Button size="lg" className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg">Join Early Member Program</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.nav>

                <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-zinc-950">
                    {/* Animated Silk Mesh Background */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            animate={{
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/30 rounded-full blur-[120px]"
                        />
                        <motion.div
                            animate={{
                                x: [0, -40, 0],
                                y: [0, -50, 0],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[140px]"
                        />
                        <motion.div
                            animate={{
                                x: [0, 60, 0],
                                y: [0, -40, 0],
                                scale: [1.2, 1, 1.2],
                            }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                            className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[100px]"
                        />
                        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />


                        {/* Noise Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">

                        {/* Ultra-Modern Headline with Character Reveal */}
                        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.85] mb-12 tracking-[-0.05em] drop-shadow-2xl">
                            <motion.span
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.8 } }
                                }}
                                className="block opacity-90"
                            >
                                {"Run your shop".split(" ").map((word, i) => (
                                    <motion.span key={i} className="inline-block mr-4" variants={{ hidden: { opacity: 0, scale: 0.8, filter: "blur(10px)" }, visible: { opacity: 1, scale: 1, filter: "blur(0px)" } }}>
                                        {word}
                                    </motion.span>
                                ))}
                            </motion.span>
                            <span className="relative">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 animate-gradient-x">
                                    like a pro.
                                </span>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ delay: 1, duration: 1.5, ease: "circOut" }}
                                    className="absolute -bottom-2 left-0 h-2 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full blur-[1px] opacity-50"
                                />
                            </span>
                        </h1>

                        {/* Refined Subheadline */}
                        <AdvancedScrollReveal variant="fadeIn" delay={800}>
                            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                                Empowering Bharat's local retailers with world-class <span className="text-white font-bold">Billing</span>, <span className="text-white font-bold">Inventory</span>, and <span className="text-white font-bold">Credit Intelligence</span>.
                            </p>
                        </AdvancedScrollReveal>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                            <AdvancedScrollReveal variant="slideUp" delay={1000}>
                                <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto mt-4 px-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                                        <button className="relative w-full sm:w-auto h-18 px-12 bg-white text-zinc-950 rounded-full text-xl font-black shadow-2xl flex items-center justify-center gap-3 uppercase tracking-tighter hover:scale-[1.02] transition-all active:scale-95">
                                            {isAuthenticated ? "Go to Dashboard" : "Secure Early Member Spot"}
                                            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </Link>
                            </AdvancedScrollReveal>
                            {!isAuthenticated && (
                                <AdvancedScrollReveal variant="slideUp" delay={1200}>
                                    <Link href="/demo" className="w-full sm:w-auto mt-4 px-4">
                                        <button className="w-full sm:w-auto h-18 px-10 bg-white/5 backdrop-blur-xl text-white text-xl border border-white/20 hover:bg-white/10 rounded-full transition-all font-black uppercase tracking-tighter hover:border-white/40 shadow-xl">
                                            Instant Demo
                                        </button>
                                    </Link>
                                </AdvancedScrollReveal>
                            )}
                        </div>
                    </div>


                    {/* Premium Curve Divider */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none">
                        <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0 200L1440 200V0C1440 0 1080 120 720 120C360 120 0 0 0 0V200Z" fill="white" />
                        </svg>
                    </div>
                </section>




                {/* Free Tools Section */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <AdvancedScrollReveal variant="slideRight">
                                    <div className="space-y-4">
                                        <span className="text-emerald-600 font-bold text-xs tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Growth Tools</span>
                                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-zinc-900 leading-tight">
                                            Free tools for <br />
                                            <span className="text-emerald-500">Every Business.</span>
                                        </h2>
                                        <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-lg">
                                            We believe in empowering local merchants. Use our professional tools for free, no account needed.
                                        </p>
                                    </div>
                                </AdvancedScrollReveal>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <Link href="/tools/gst-calculator" className="group p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-emerald-500/50 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                            <Calculator className="text-emerald-600" />
                                        </div>
                                        <h3 className="text-xl font-black italic mb-2">GST Finder</h3>
                                        <p className="text-zinc-500 text-sm font-medium">Find HSN codes and calculate taxes in seconds.</p>
                                    </Link>
                                    <Link href="/tools/business-card" className="group p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-emerald-500/50 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                            <Tag className="text-emerald-600" />
                                        </div>
                                        <h3 className="text-xl font-black italic mb-2">Card Maker</h3>
                                        <p className="text-zinc-500 text-sm font-medium">Create professional visiting cards for your shop.</p>
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full" />
                                <div className="relative bg-zinc-950/90 backdrop-blur-3xl rounded-[3rem] p-4 shadow-2xl overflow-hidden group border border-white/10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                    <div className="relative border border-white/5 rounded-[2.5rem] overflow-hidden">
                                        <img
                                            src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1000"
                                            alt="Merchant using KhataPlus"
                                            className="w-full h-auto opacity-80 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                                        <div className="absolute bottom-10 left-10 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                                <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] opacity-60">Live in Guwahati</span>
                                            </div>
                                            <p className="text-white text-3xl font-black tracking-tight leading-none italic">"KhataPlus changed how<br />I track credit."</p>
                                            <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">— Rahul, New Market</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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

                {/* Detailed Features Sections */}

                {/* Offline Mode */}
                <section id="offline" className="py-24 md:py-32 px-6 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="slideLeft">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-semibold mb-6">
                                        <WifiOff size={16} />
                                        Works Anywhere
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6">Built for the real world.</h2>
                                    <p className="text-zinc-600 text-xl mb-8 leading-relaxed">
                                        Don't let patchy internet stop your business. KhataPlus works fully offline and syncs automatically when you're back online.
                                    </p>
                                    <ul className="space-y-4">
                                        {[
                                            "Continue billing without internet",
                                            "Seamless background synchronization",
                                            "Local data storage on your device",
                                            "Instant performance, zero lag"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-zinc-700">
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <Check size={12} className="text-emerald-600" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </AdvancedScrollReveal>
                            </div>
                            <div className="w-full md:w-1/2 relative">
                                <AdvancedScrollReveal variant="scaleUp">
                                    <div className="relative bg-zinc-100 rounded-3xl p-8 aspect-square flex items-center justify-center overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-200/20 to-emerald-200/20" />
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                rotate: [0, 1, 0]
                                            }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                            className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
                                        >
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="h-6 w-24 bg-zinc-100 rounded" />
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                    <span className="text-[10px] font-mono text-zinc-400 tracking-tighter">OFFLINE MODE</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-10 bg-zinc-50 rounded-lg flex items-center px-4 border border-zinc-100">
                                                    <div className="h-2 w-full bg-zinc-200 rounded" />
                                                </div>
                                                <div className="h-10 bg-zinc-50 rounded-lg flex items-center px-4 border border-zinc-100">
                                                    <div className="h-2 w-3/4 bg-zinc-200 rounded" />
                                                </div>
                                                <div className="h-10 bg-emerald-50 rounded-lg flex items-center px-4 border border-emerald-100">
                                                    <div className="h-2 w-full bg-emerald-200 rounded" />
                                                </div>
                                            </div>
                                        </motion.div>
                                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
                                    </div>
                                </AdvancedScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Analytics */}
                <section id="analytics" className="py-24 md:py-32 px-6 bg-zinc-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="slideRight">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold mb-6 border border-emerald-100/50 shadow-sm">
                                        <TrendingUp size={16} />
                                        Insights
                                    </div>
                                    <GradientText className="text-4xl md:text-6xl font-extrabold mb-6" colors={["#059669", "#10b981", "#34d399"]}>
                                        Know your business pulse.
                                    </GradientText>
                                    <p className="text-zinc-500 text-xl mb-10 leading-relaxed max-w-xl">
                                        Visualize your growth with powerful analytics. Track sales trends, monitor inventory health, and identify your most profitable items.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                                        {[
                                            { label: "Daily Sales", value: "Real-time", icon: Zap },
                                            { label: "Top Items", value: "Automated", icon: Star },
                                            { label: "Inventory", value: "Live Status", icon: Package },
                                            { label: "Profit Margin", value: "Calculated", icon: ArrowUpRight }
                                        ].map((stat, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                className="p-5 bg-white rounded-3xl border border-zinc-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] transition-all duration-300 group"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                                        <stat.icon size={16} />
                                                    </div>
                                                    <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</div>
                                                </div>
                                                <div className="text-emerald-600 font-black text-xl md:text-2xl">{stat.value}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AdvancedScrollReveal>
                            </div>
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="scaleUp">
                                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 aspect-video relative overflow-hidden flex flex-col justify-end">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                                        <div className="relative flex items-end justify-between gap-2 h-32 mb-4">
                                            {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${h}%` }}
                                                    transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                                                    className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-sm"
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-zinc-400 text-xs font-mono uppercase tracking-widest border-t border-white/5 pt-4">
                                            <span>Mon</span>
                                            <span>Tue</span>
                                            <span>Wed</span>
                                            <span>Thu</span>
                                            <span>Fri</span>
                                            <span>Sat</span>
                                            <span>Sun</span>
                                        </div>
                                    </div>
                                </AdvancedScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section id="security" className="py-24 md:py-32 px-6 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="slideLeft">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                                        <ShieldCheck size={16} />
                                        Secure
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6">Safe like a bank vault.</h2>
                                    <p className="text-zinc-600 text-xl mb-8 leading-relaxed">
                                        Your financial data is private and secure. We use enterprise-grade encryption and automated backups to ensure your records are always safe.
                                    </p>
                                    <div className="space-y-6">
                                        <div className="flex gap-4 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                                                <Zap size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-zinc-900">Instant Backups</h4>
                                                <p className="text-zinc-500 text-sm">Every entry is instantly backed up to our secure cloud servers.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-zinc-900">Biometric Access</h4>
                                                <p className="text-zinc-500 text-sm">Protect your sensitive data with FaceID or Fingerprint lock.</p>
                                            </div>
                                        </div>
                                    </div>
                                </AdvancedScrollReveal>
                            </div>
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="scaleUp">
                                    <div className="relative group">
                                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-[3rem] blur-2xl group-hover:opacity-100 transition duration-1000" />
                                        <div className="relative bg-white border border-zinc-100 rounded-[2.5rem] p-12 shadow-xl flex items-center justify-center overflow-hidden">
                                            <motion.div
                                                animate={{
                                                    rotateY: [0, 180, 360],
                                                }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                className="w-48 h-48 rounded-full border-8 border-emerald-500/20 flex items-center justify-center"
                                            >
                                                <ShieldCheck size={80} className="text-emerald-500" />
                                            </motion.div>
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
                                        </div>
                                    </div>
                                </AdvancedScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* GST Invoicing */}
                <section id="gst" className="py-24 md:py-32 px-6 bg-emerald-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66 3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-45c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                    }} />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="slideRight">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-emerald-200 text-sm font-semibold mb-6">
                                        <FileText size={16} />
                                        GST Ready
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Tax compliance made easy.</h2>
                                    <p className="text-emerald-100/80 text-xl mb-8 leading-relaxed">
                                        Generate GST-compliant tax invoices in seconds. Shared instantly via WhatsApp or email, making your business look professional.
                                    </p>
                                    <div className="space-y-4">
                                        {[
                                            "Customizable GST rates for products",
                                            "Automatic tax calculations",
                                            "Professional PDF invoice templates",
                                            "One-click WhatsApp sharing"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                                <span className="text-emerald-50">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </AdvancedScrollReveal>
                            </div>
                            <div className="w-full md:w-1/2">
                                <AdvancedScrollReveal variant="scaleUp">
                                    <div className="relative bg-white text-zinc-900 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                        <div className="flex justify-between border-b pb-4 mb-4">
                                            <div>
                                                <div className="text-xs uppercase text-zinc-400 font-bold tracking-widest">Tax Invoice</div>
                                                <div className="font-bold">INV-2026-001</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-emerald-600">KhataPlus</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Subtotal</span>
                                                <span className="font-medium">₹12,450.00</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">GST (18%)</span>
                                                <span className="font-medium">₹2,241.00</span>
                                            </div>
                                            <div className="flex justify-between border-t border-dashed pt-3">
                                                <span className="font-bold">Total Amount</span>
                                                <span className="font-bold text-emerald-600">₹14,691.00</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm gap-2">
                                            <Smartphone size={16} /> Share via WhatsApp
                                        </div>
                                    </div>
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
                            <div className={`relative transition-all duration-500 ease-in-out ${activeTab === 'desktop' ? 'h-[600px] md:h-auto md:aspect-[16/9]' : 'h-[750px] md:h-[850px] md:aspect-[16/9]'} rounded-3xl border border-white/10 p-1 md:p-4 backdrop-blur-2xl bg-gradient-to-br from-white/5 to-white/0`}>
                                <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0F0F0F] flex items-center justify-center">
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
                                                <div className="w-72 h-full border-r border-white/10 bg-white/5 flex flex-col p-6 gap-6 hidden md:flex">
                                                    <div className="w-40 h-10 bg-white/10 rounded-md animate-pulse" />
                                                    <div className="space-y-4 mt-4">
                                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                                            <div key={i} className="w-full h-12 bg-white/5 rounded-xl flex items-center px-4 gap-3">
                                                                <div className="w-5 h-5 rounded bg-white/10" />
                                                                <div className="flex-1 h-3 bg-white/10 rounded" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 overflow-y-auto md:overflow-hidden">
                                                    <div className="md:col-span-2 space-y-6 md:space-y-8">
                                                        <div className="h-24 bg-white/5 rounded-2xl border border-white/10 p-6 flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20" />
                                                            <div className="space-y-2">
                                                                <div className="w-32 h-4 bg-white/10 rounded" />
                                                                <div className="w-48 h-3 bg-white/5 rounded" />
                                                            </div>
                                                        </div>
                                                        <div className="h-[300px] md:h-[400px] bg-white/5 rounded-2xl border border-white/10 p-6 relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
                                                            <div className="relative z-10 h-full flex flex-col">
                                                                <div className="w-1/3 h-6 bg-white/10 rounded mb-8" />
                                                                <div className="flex-1 w-full bg-gradient-to-t from-emerald-500/20 to-transparent rounded-xl border border-white/5 mt-auto" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-1 space-y-6">
                                                        <div className="h-48 bg-white/5 rounded-2xl border border-white/10 p-6">
                                                            <div className="w-1/2 h-4 bg-white/10 rounded mb-4" />
                                                            <div className="space-y-3">
                                                                {[1, 2, 3].map(i => <div key={i} className="w-full h-8 bg-white/5 rounded-lg" />)}
                                                            </div>
                                                        </div>
                                                        <div className="h-48 bg-white/5 rounded-2xl border border-white/10 p-6">
                                                            <div className="w-1/2 h-4 bg-white/10 rounded mb-4" />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
                                                            </div>
                                                        </div>
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
                                                className="w-full h-full flex flex-col items-center justify-center p-4 md:p-12"
                                            >
                                                <div className="w-[340px] h-[680px] border-[8px] border-zinc-800 rounded-[3.5rem] bg-black relative overflow-hidden shadow-2xl scale-95 sm:scale-100 md:scale-105 lg:scale-115 origin-center ring-1 ring-white/10 transition-transform duration-500">
                                                    {/* Notch */}
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-zinc-800 rounded-b-2xl z-20" />

                                                    {/* Status Bar */}
                                                    <div className="absolute top-2 right-5 z-20 flex gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                        <div className="w-4 h-1.5 rounded-full bg-zinc-600" />
                                                    </div>

                                                    <div className="h-full w-full bg-[#09090b] flex flex-col relative text-white font-sans rounded-[2.6rem] overflow-hidden">
                                                        {/* App Header */}
                                                        <div className="pt-10 pb-4 px-5 flex items-center justify-between border-b border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">K</div>
                                                                <div className="cursor-default">
                                                                    <div className="h-2 w-20 bg-emerald-500/20 rounded mb-1" />
                                                                    <div className="h-2 w-12 bg-white/20 rounded" />
                                                                </div>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-white/5" />
                                                        </div>

                                                        <div className="flex-1 p-5 space-y-6 overflow-hidden relative">
                                                            {/* Quick Actions Grid */}
                                                            <div>
                                                                <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                                                                <div className="grid grid-cols-4 gap-3">
                                                                    {[1, 2, 3, 4].map(i => (
                                                                        <div key={i} className="flex flex-col items-center gap-2">
                                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${i === 1 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>
                                                                                {i === 1 && <Receipt size={20} />}
                                                                                {i === 2 && <Package size={20} />}
                                                                                {i === 3 && <Users size={20} />}
                                                                                {i === 4 && <BarChart3 size={20} />}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Hero Card */}
                                                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={60} /></div>
                                                                <div className="relative z-10">
                                                                    <div className="h-3 w-20 bg-white/40 rounded mb-2" />
                                                                    <div className="h-8 w-32 bg-white rounded mb-2" />
                                                                    <div className="h-3 w-16 bg-emerald-200/50 rounded" />
                                                                </div>
                                                            </div>

                                                            {/* Recent List */}
                                                            <div className="space-y-3">
                                                                <div className="h-3 w-24 bg-white/10 rounded" />
                                                                {[1, 2].map(i => (
                                                                    <div key={i} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-white/10" />
                                                                            <div className="space-y-1">
                                                                                <div className="h-2 w-20 bg-white/20 rounded" />
                                                                                <div className="h-2 w-12 bg-white/10 rounded" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="h-3 w-10 bg-emerald-500/30 rounded" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Bottom Tab Bar */}
                                                        <div className="h-16 bg-[#09090b]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 rounded-b-[2.5rem]">
                                                            <div className="flex flex-col items-center gap-1 text-emerald-500">
                                                                <Monitor size={20} />
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1 text-zinc-600">
                                                                <Receipt size={20} />
                                                            </div>
                                                            <div className="w-12 h-12 -mt-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
                                                                <span className="text-xl font-bold">+</span>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1 text-zinc-600">
                                                                <Users size={20} />
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1 text-zinc-600">
                                                                <Wallet size={20} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mt-8 grid md:grid-cols-2 gap-8">
                                <div className={`p-6 rounded-2xl border border-white/10 transition-all duration-300 ${activeTab === 'desktop' ? 'bg-white/10 block' : 'bg-transparent opacity-50 hidden md:block'}`}>
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Monitor className="w-5 h-5 text-emerald-400" /> Desktop Power</h3>
                                    <p className="text-gray-400">Full-featured dashboard with multi-pane layouts, deep analytics, and administrative controls optimized for productivity on large screens.</p>
                                </div>
                                <div className={`p-6 rounded-2xl border border-white/10 transition-all duration-300 ${activeTab === 'pwa' ? 'bg-white/10 block' : 'bg-transparent opacity-50 hidden md:block'}`}>
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
                                LEGACY PRIVILEGE
                            </div>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                                Lifetime Privilege for <span className="text-emerald-600">Early Members</span>
                            </h2>
                            <p className="text-zinc-500 text-xl mb-12">
                                Join our first 1,000 members and secure legacy access.
                            </p>

                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-10 md:p-12 text-white shadow-xl shadow-emerald-500/20 mx-auto relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 p-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                                <p className="text-emerald-100 text-lg font-medium mb-2 relative z-10">Pioneer Program</p>
                                <div className="text-6xl font-bold mb-3 relative z-10 flex items-center justify-center gap-1">
                                    <span>₹</span>
                                    <Counter from={999} to={0} duration={2} />
                                </div>
                                <p className="text-emerald-100 text-lg mb-8 relative z-10">Lifetime Value for Early Members</p>
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
                                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                                <Link href="#" className="hover:text-white transition-colors">Contact</Link>
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
            </div>
        </LazyMotion>
    )
}

