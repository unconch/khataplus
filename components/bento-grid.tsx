"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto", className)}>
            {children}
        </div>
    )
}

interface BentoCardProps {
    name: string
    className?: string
    background?: ReactNode
    Icon: any
    description: string
    href: string
    cta: string
}

export function BentoCard({
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta,
}: BentoCardProps) {
    return (
        <motion.div
            key={name}
            className={cn(
                "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl",
                // Light mode styles
                "bg-white border border-zinc-200",
                // Hover styles
                "hover:shadow-xl transition-all duration-300",
                className
            )}
            whileHover={{ y: -5 }}
        >
            <div className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-105">
                {background}
            </div>

            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

            <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
                <div className="h-12 w-12 origin-left transform-gpu text-emerald-600 transition-all duration-300 ease-in-out group-hover:scale-75">
                    <div className="bg-emerald-100/50 p-3 rounded-2xl backdrop-blur-sm">
                        <Icon size={24} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                    {name}
                </h3>
                <p className="max-w-lg text-zinc-500">{description}</p>
            </div>

            <div
                className={cn(
                    "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
                )}
            >
                <div className="pointer-events-auto">
                    <a
                        href={href}
                        className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
                    >
                        {cta}
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[0.03] group-hover:backdrop-blur-[1px]" />
        </motion.div>
    )
}
