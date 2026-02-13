import { BusinessCardTool } from "@/components/business-card-tool"
import Link from "next/link"
import { ChevronLeft, Sparkles } from "lucide-react"

export const metadata = {
    title: "Free Business Card Maker for Small Shops | KhataPlus",
    description: "Create professional business cards for your shop for free. Choose templates, colors and download as high-res images. No design skills needed.",
}

export default function BusinessCardPage() {
    return (
        <div className="h-screen w-full bg-zinc-950 overflow-hidden relative">
            <Link href="/" className="absolute top-4 left-24 z-50 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors group">
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>
            <BusinessCardTool />
        </div>
    )
}
