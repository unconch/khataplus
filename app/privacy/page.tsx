"use client"

import Link from "next/link"
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-emerald-500/30">
            {/* Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Logo size={32} className="text-emerald-600" />
                        <span className="font-bold text-xl tracking-tight text-zinc-900">KhataPlus</span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-zinc-100 rounded-full px-4 text-zinc-600">
                            <ArrowLeft size={16} /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <div
                        className="mb-16 text-center md:text-left animate-in fade-in slide-up duration-500"
                    >
                        <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 text-emerald-600 mx-auto md:mx-0 shadow-sm border border-emerald-100/50">
                            <Shield size={40} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-zinc-900">Privacy Policy</h1>
                        <p className="text-zinc-500 text-xl font-medium">Built for trust, compliant with DPDPA 2023.</p>
                        <div className="mt-8 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full font-semibold border border-emerald-100 shadow-sm mx-auto md:mx-0">
                            <ClockIcon className="w-4 h-4" />
                            <span>Effective Date: February 15, 2026</span>
                        </div>
                    </div>

                    <div className="space-y-16">
                        {/* 1. Introduction */}
                        <section className="scroll-mt-32" id="introduction">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">01</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <Eye className="w-6 h-6 text-emerald-500" />
                                        Introduction
                                    </h2>
                                    <div className="prose prose-zinc prose-lg text-zinc-600 leading-relaxed">
                                        <p>
                                            At KhataPlus, we believe your business data belongs to you. Our mission is to provide you with powerful tools while ensuring your information stays private, secure, and accessible only to you.
                                        </p>
                                        <p className="font-bold text-zinc-900">
                                            We operate in full compliance with the Digital Personal Data Protection Act (DPDPA) 2023 of India.
                                        </p>
                                        <p>
                                            This Privacy Policy describes how we collect, use, and handle your information when you use our websites, software, and services ("Services"). By using our Services, you're agreeing to the practices described in this policy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Information We Collect */}
                        <section className="scroll-mt-32" id="collection">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">02</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <Database className="w-6 h-6 text-emerald-500" />
                                        Information We Collect
                                    </h2>
                                    <div className="space-y-8">
                                        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                                            <h3 className="text-lg font-bold text-zinc-900 mb-3">Business Records</h3>
                                            <p className="text-zinc-600 leading-relaxed">
                                                We collect information you provide directly through our Services, including shop details, inventory data, sales transactions, and customer credit information. This data is encrypted and stored securely.
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                                            <h3 className="text-lg font-bold text-zinc-900 mb-3">Account Details</h3>
                                            <p className="text-zinc-600 leading-relaxed">
                                                To create an account, we collect basic profile information such as your name, email address, phone number, and shop location.
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                                            <h3 className="text-lg font-bold text-zinc-900 mb-3">Usage & Device Information</h3>
                                            <p className="text-zinc-600 leading-relaxed">
                                                We collect information about how you access and use KhataPlus, including IP addresses, browser types, device identifiers, and operating system information to provide a consistent experience across all your devices.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Third-Party Services */}
                        <section className="scroll-mt-32" id="third-party">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">03</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <Globe className="w-6 h-6 text-emerald-500" />
                                        Third-Party Services
                                    </h2>
                                    <p className="text-zinc-600 mb-8 leading-relaxed">
                                        We use a limited number of trusted third-party providers to help us provide, improve, protect, and promote our Services:
                                    </p>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: "Neon", purpose: "Database Infrastructure" },
                                            { name: "Supabase", purpose: "Authentication & Security" },
                                            { name: "Vercel", purpose: "Hosting & Analytics" },
                                            { name: "Sentry", purpose: "Reliability & Performance" },
                                            { name: "Resend", purpose: "Transactional Communications" }
                                        ].map((service, i) => (
                                            <li key={i} className="flex flex-col p-4 rounded-xl border border-zinc-100 bg-white shadow-sm">
                                                <span className="font-bold text-zinc-900">{service.name}</span>
                                                <span className="text-sm text-zinc-500">{service.purpose}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 4. Data Security */}
                        <section className="scroll-mt-32" id="security">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">04</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <Lock className="w-6 h-6 text-emerald-500" />
                                        Data Security
                                    </h2>
                                    <div className="prose prose-zinc prose-lg text-zinc-600 leading-relaxed">
                                        <p>
                                            We take security seriously. We use bank-grade AES-256 encryption for data at rest and TLS for data in transit. We perform regular automated backups and maintain strict internal access controls.
                                        </p>
                                        <p>
                                            While we implement robust safeguards, no method of electronic storage is 100% secure. We cannot guarantee absolute security, but we promise to maintain and evolve our security protocols to industry-leading standards.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 5. Cookies & Local Storage */}
                        <section className="scroll-mt-32" id="cookies">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">05</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                        Cookies & Local Storage
                                    </h2>
                                    <p className="text-zinc-600 leading-relaxed">
                                        We use cookies and similar technologies like local storage to provide Services, understand how you use our application, and remember your preferences. This helps in providing you with a seamless experience, such as keeping you signed in and maintaining your offline data.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 6. Your Rights & Data Portability */}
                        <section className="scroll-mt-32" id="rights">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">06</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6">Your Rights & Control</h2>
                                    <p className="text-zinc-600 mb-6 leading-relaxed">
                                        You have control over your information and how it's used. You can:
                                    </p>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            "Access and export your business data at any time.",
                                            "Correct or change your account details from the settings.",
                                            "Delete your entire account and all associated data.",
                                            "Request a restriction on the processing of your data."
                                        ].map((right, i) => (
                                            <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                                                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                                <span className="text-zinc-700 font-medium">{right}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 7. Changes to Policy */}
                        <section className="scroll-mt-32" id="changes">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center flex-shrink-0 border border-zinc-100 text-zinc-400">
                                    <span className="font-bold">07</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                                        <Bell className="w-6 h-6 text-emerald-500" />
                                        Changes to this Policy
                                    </h2>
                                    <p className="text-zinc-600 leading-relaxed">
                                        We may revise this Privacy Policy from time to time. The most current version will always be posted on our website. If a revision meaningfully reduces your rights, we will notify you through the application or via email.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="p-10 md:p-16 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10 text-center max-w-xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-bold mb-6">Still have questions?</h2>
                                <p className="text-zinc-400 mb-10 text-lg">
                                    Our support team is here to help you understand how we protect your business.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg font-bold shadow-lg shadow-emerald-500/20">
                                        <a href="mailto:privacy@khataplus.online">Email Privacy Team</a>
                                    </Button>
                                    <Link href="/">
                                        <Button variant="outline" className="h-14 px-8 border-white/20 text-white hover:bg-white/5 rounded-full text-lg font-bold">
                                            Back to Home
                                        </Button>
                                    </Link>
                                </div>
                                <div className="mt-8 text-zinc-500 text-sm">
                                    Grievance Officer: As required under the DPDPA 2023, reach us at privacy@khataplus.online
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-900 text-white py-16 px-6 border-t border-zinc-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="flex items-center gap-3">
                                <Logo size={40} className="text-emerald-400" />
                                <span className="font-bold text-2xl tracking-tighter">KhataPlus</span>
                            </div>
                            <p className="text-zinc-500 max-w-xs text-center md:text-left text-sm">
                                Empowering shopkeepers with secure and simple digital ledgers.
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-4">
                            <div className="flex gap-8 text-zinc-400">
                                <Link href="/terms-and-condition" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
                                <Link href="/" className="hover:text-emerald-400 transition-colors">About</Link>
                            </div>
                            <div className="text-zinc-600 text-xs">
                                © 2026 KhataPlus Inc. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function ClockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}

function CheckCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
