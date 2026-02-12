import { BetaEnrollment } from "@/components/beta-enrollment"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata = {
    title: "Join the Founders Club | KhataPlus Early Access",
    description: "Be one of the first 500 shops to use KhataPlus and get lifetime free access to all premium billing features.",
}

export default function BetaPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Minimal Header */}
            <nav className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <ChevronLeft size={18} className="text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black italic tracking-tighter text-xl">KHATAPLUS</span>
                </Link>
                <div className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse">
                    Join Beta
                </div>
            </nav>

            <main>
                <BetaEnrollment />
            </main>
        </div>
    )
}
