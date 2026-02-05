"use client"

import { useRef } from "react"
import { motion, useInView, Variant } from "framer-motion"

type AnimationVariant = "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleUp" | "rotate"

interface AdvancedScrollRevealProps {
    children: React.ReactNode
    variant?: AnimationVariant
    delay?: number
    duration?: number
    className?: string
    once?: boolean
    threshold?: number
}

export function AdvancedScrollReveal({
    children,
    variant = "slideUp",
    delay = 0,
    duration = 0.5,
    className = "",
    once = true,
    threshold = 0.2
}: AdvancedScrollRevealProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { amount: threshold, once })

    const variants: Record<AnimationVariant, { hidden: Variant; visible: Variant }> = {
        fadeIn: {
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
        },
        slideUp: {
            hidden: { opacity: 0, y: 30 }, // Reduced distance
            visible: { opacity: 1, y: 0 }
        },
        slideLeft: {
            hidden: { opacity: 0, x: -30 }, // Reduced distance
            visible: { opacity: 1, x: 0 }
        },
        slideRight: {
            hidden: { opacity: 0, x: 30 }, // Reduced distance
            visible: { opacity: 1, x: 0 }
        },
        scaleUp: {
            hidden: { opacity: 0, scale: 0.95 }, // More subtle scale
            visible: { opacity: 1, scale: 1 }
        },
        rotate: {
            hidden: { opacity: 0, rotate: -2, scale: 0.95 }, // Subtle rotation
            visible: { opacity: 1, rotate: 0, scale: 1 }
        }
    }

    const selectedVariant = variants[variant]

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: selectedVariant.hidden,
                visible: {
                    ...selectedVariant.visible,
                    transition: {
                        duration: duration * 1.5, // 50% slower globally
                        delay: delay / 1000,
                        ease: [0.25, 0.1, 0.25, 1.0] // "Cinematic" smooth ease-out (cubic-bezier)
                    }
                }
            }}
            viewport={{ once: true, amount: threshold }} // Improved viewport options
            style={{
                // Will-change hint for browser optimization
                willChange: "opacity, transform"
            }}
        >
            {children}
        </motion.div>
    )
}
