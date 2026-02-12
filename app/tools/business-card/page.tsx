import { BusinessCardTool } from "@/components/business-card-tool"
import Link from "next/link"
import { ChevronLeft, Sparkles } from "lucide-react"

export const metadata = {
    title: "Free Business Card Maker for Small Shops | KhataPlus",
    description: "Create professional business cards for your shop for free. Choose templates, colors and download as high-res images. No design skills needed.",
}

export default function BusinessCardPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Minimal Header */}
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/10">
                    <Sparkles size={12} className="text-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Viral Tool</span>
                </div>
            </div>

            <main className="py-12 md:py-20">
                <div className="max-w-4xl mx-auto px-6 mb-12 text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">Business Card Maker</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                        Stand out from the crowd with a professional business card. Designed for Indian shopkeepers, retailers, and wholesalers.
                    </p>
                </div>

                <BusinessCardTool />
            </main>

            {/* Simple Footer */}
            <footer className="py-20 border-t border-zinc-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-muted-foreground">
                        <Link href="/tools/gst-calculator" className="hover:text-foreground">GST Calculator</Link>
                        <Link href="/#features" className="hover:text-foreground">Features</Link>
                        <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
                        <Link href="/auth/sign-up" className="hover:text-foreground text-emerald-600">Start Free Trial</Link>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        &copy; 2026 KHATAPLUS. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </footer>
        </div>
    )
}
