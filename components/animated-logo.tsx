"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedLogoProps {
    className?: string
    size?: number
}

export function AnimatedLogo({ className, size = 120 }: AnimatedLogoProps) {
    // Animation Variants
    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    }

    const bookVariants: any = {
        hidden: { scale: 0.8, opacity: 0, y: 20 },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    }

    const textVariants: any = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    }

    const plusVariants: any = {
        hidden: { scale: 0, rotate: -45, opacity: 0 },
        visible: {
            scale: 1,
            rotate: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.6
            }
        }
    }

    return (
        <motion.div
            className={cn("flex flex-col items-center justify-center p-8", className)}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={bookVariants} className="relative z-10">
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-2xl"
                >
                    {/* Shadow - subtle drop shadow */}
                    <path d="M8 26L26 26L28 9L10 9L8 26Z" fill="currentColor" fillOpacity="0.1" transform="translate(2, 2)" />

                    {/* White Pages Thickness (Right and Bottom) */}
                    <path d="M7 25L25 25L27 7L25 6L25 24L7 24L7 25Z" fill="#e4e4e7" className="text-zinc-200 dark:text-zinc-700" fillOpacity="1" />
                    <path d="M25 24L27 7L27 25L25 24Z" fill="#d4d4d8" className="text-zinc-300 dark:text-zinc-600" fillOpacity="1" />

                    {/* Main Cover (Front Face) */}
                    <path
                        d="M5 5H23C24.1046 5 25 5.89543 25 7V23C25 24.1046 24.1046 25 23 25H5C3.89543 25 3 24.1046 3 23V7C3 5.89543 3.89543 5 5 5Z"
                        fill="currentColor"
                        className="text-emerald-500"
                    />

                    {/* Cover Gradient/Highlight */}
                    <rect x="3" y="5" width="22" height="20" rx="2" fill="white" fillOpacity="0.15" />
                    {/* Spine Shade */}
                    <path d="M3 7C3 5.89543 3.89543 5 5 5H6V25H5C3.89543 25 3 24.1046 3 23V7Z" fill="black" fillOpacity="0.1" />

                    {/* 3D Embossed Plus Symbol - Animated! */}
                    <motion.g variants={plusVariants} style={{ originX: "14px", originY: "15px" }}>
                        {/* Shadow for depth */}
                        <path d="M14 11V19" stroke="black" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" transform="translate(1,1)" />
                        <path d="M10 15H18" stroke="black" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" transform="translate(1,1)" />
                        {/* Main Plus */}
                        <path d="M14 11V19" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        <path d="M10 15H18" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    </motion.g>
                </svg>
            </motion.div>

            <motion.div variants={textVariants} className="mt-6 flex flex-col items-center">
                <span className="text-3xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-400">
                    KHATA
                </span>
                <span className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400 leading-none mt-1">
                    PLUS
                </span>
            </motion.div>
        </motion.div>
    )
}
