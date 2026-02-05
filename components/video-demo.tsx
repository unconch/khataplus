"use client"

import { useState } from "react"
import { Play, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface VideoDemoProps { }

export function VideoDemo({ }: VideoDemoProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isZoomed, setIsZoomed] = useState(false)

    // Premium image showcase (no video needed)
    return (
        <div className="relative group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative bg-zinc-900 rounded-[2rem] p-2 shadow-2xl border border-white/10 overflow-hidden">
                <div className="rounded-[1.5rem] overflow-hidden bg-zinc-950 aspect-video relative">
                    {/* Product Mockup Image */}
                    <div
                        className={`absolute inset-0 transition-transform duration-500 cursor-zoom-in ${isZoomed ? 'scale-110' : 'scale-100 hover:scale-[1.02]'}`}
                        onClick={() => setIsZoomed(!isZoomed)}
                    >
                        <Image
                            src="/images/khataplus_mockup.png"
                            alt="KhataPlus Dashboard"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Badge Overlay */}
                    <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2 pointer-events-none">
                        <Sparkles size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Product Tour</span>
                    </div>

                    {/* Call to Action */}
                    <div className="absolute bottom-4 right-4 z-10">
                        <div className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 animate-pulse">
                            Try it Free →
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>
    )
}
