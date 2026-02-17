"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Zap, Shield } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

export function SecuritySection() {
    return (
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
                                Your financial data is private and secure. We are <span className="text-emerald-600 font-bold underline decoration-emerald-500/30">DPDPA 2023 compliant</span>, using bank-grade encryption to ensure your records never leave your control.
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
    )
}
