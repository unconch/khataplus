import { BusinessCardTool } from "@/components/business-card-tool"
import Link from "next/link"
import { ChevronLeft, Sparkles } from "lucide-react"

export const metadata = {
    title: "Free Business Card Maker for Small Shops | KhataPlus",
    description: "Create professional business cards for your shop for free. Choose templates, colors and download as high-res images. No design skills needed.",
}

export default function BusinessCardPage() {
    return (
        <div className="h-screen w-full bg-[#050505] overflow-hidden relative selection:bg-emerald-500/30">
            {/* Studio Atmospheric Background */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 hero-glow hero-gradient-motion mix-blend-screen" />
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
            </div>

            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Exit Studio
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Card Designer <span className="text-zinc-600 ml-2">v4.0</span></span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" className="w-full h-full object-cover opacity-80" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">12 others designing now</span>
                </div>
            </div>

            <BusinessCardTool />
        </div>
    )
}
