"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function TermsOfService() {
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
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={16} /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
                        <p className="text-zinc-500 text-lg">Last updated: February 6, 2026</p>
                    </motion.div>

                    <div className="prose prose-zinc prose-lg max-w-none space-y-12 text-zinc-700">
                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using KhataPlus, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. Use of the Service</h2>
                            <p>
                                KhataPlus provides business management tools including billing, inventory management, and credit tracking. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. User Responsibilities</h2>
                            <p>As a user of KhataPlus, you agree to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>Provide accurate and complete information during sign-up.</li>
                                <li>Use the service in compliance with all applicable laws.</li>
                                <li>Not use the service for any fraudulent or illegal activities.</li>
                                <li>Keep your business data updated and accurate.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Data Ownership</h2>
                            <p>
                                You retain all rights and ownership to the business data you input into KhataPlus. We do not claim any ownership rights over your business records.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">5. Beta Status</h2>
                            <p>
                                KhataPlus is currently in Beta. While we strive for maximum reliability, the service is provided "as is" and "as available." Early adopters are encouraged to provide feedback to help us improve.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">6. Limitation of Liability</h2>
                            <p>
                                KhataPlus and its creators shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-4">7. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these Terms of Service at any time. Significant changes will be communicated via the application or website.
                            </p>
                        </section>

                        <section className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 mt-16">
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">Agreement</h2>
                            <p className="text-zinc-600 mb-6">
                                Continued use of KhataPlus constitutes your acceptance of any changes to these Terms of Service.
                            </p>
                            <Link href="/">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    I Understand
                                </Button>
                            </Link>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-900 text-white py-12 px-6 border-t border-zinc-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Logo size={32} className="text-emerald-400" />
                        <span className="font-bold text-xl">KhataPlus</span>
                    </div>
                    <div className="text-zinc-500 text-sm">
                        © 2026 KhataPlus. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}
