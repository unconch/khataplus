"use client"

import { cn } from "@/lib/utils"

interface AnimatedLogoProps {
    className?: string
    size?: number
}

export function AnimatedLogo({ className, size = 120 }: AnimatedLogoProps) {
    return (
        <div
            className={cn("flex flex-col items-center justify-center p-8 animate-in fade-in duration-700", className)}
        >
            <div className="relative z-10 animate-logo-book">
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-2xl"
                >
                    {/* Background Pages Layers */}
                    <rect x="40" y="30" width="70" height="80" rx="12" fill="#E2E8F0" />
                    <rect x="30" y="40" width="75" height="75" rx="12" fill="#F1F5F9" />

                    {/* Shadow */}
                    <rect x="10" y="15" width="90" height="90" rx="16" fill="black" fillOpacity="0.05" transform="translate(4, 4)" />

                    {/* Main Cover */}
                    <rect x="10" y="10" width="90" height="90" rx="16" fill="#10B981" />

                    {/* Spine Shade */}
                    <path d="M10 26C10 17.1634 17.1634 10 26 10H30V100H26C17.1634 100 10 92.8366 10 84V26Z" fill="#059669" />

                    {/* Plus Symbol - Chunky & Rounded */}
                    <rect x="30" y="50" width="50" height="10" rx="5" fill="white" className="animate-logo-plus" />
                    <rect x="50" y="30" width="10" height="50" rx="5" fill="white" className="animate-logo-plus" />
                </svg>
            </div>

            <div className="mt-6 flex flex-col items-center animate-in fade-in slide-up animation-delay-700">
                <span className="text-3xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-400">
                    KHATA
                </span>
                <span className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400 leading-none mt-1">
                    PLUS
                </span>
            </div>
        </div>
    )
}
