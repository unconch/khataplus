import { GSTCalculator } from "@/components/gst-calculator"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata = {
    title: "Free GST Calculator for Indian Shops | KhataPlus",
    description: "Calculate GST inclusive and exclusive amounts easily with our free tool. Built for small businesses and shopkeepers in India.",
}

export default function GSTCalculatorPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Minimal Header */}
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">KhataPlus Tools</span>
                </div>
            </div>

            <main className="py-12 md:py-20">
                <div className="max-w-4xl mx-auto px-6 mb-12 text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">GST Calculator</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                        The simplest way to calculate GST for your business. Accurate, fast, and free forever.
                    </p>
                </div>

                <GSTCalculator />
            </main>

            {/* Simple Footer */}
            <footer className="py-20 border-t border-zinc-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-muted-foreground">
                        <Link href="/#features" className="hover:text-foreground">Features</Link>
                        <Link href="/auth/sign-up" className="hover:text-foreground text-emerald-600">Start Free</Link>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        &copy; 2026 KHATAPLUS. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </footer>
        </div>
    )
}
