"use client"

import { useRef, useEffect } from "react"
import { useMotion } from "@/components/motion-provider"

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

/**
 * Problem 1 Fix: Shared global observer to reduce memory usage and layout thrashing.
 * Handles multiple reveal components with a single observer instance.
 */
let globalObserver: IntersectionObserver | null = null

function getGlobalObserver() {
    if (typeof window === "undefined") return null

    if (!globalObserver) {
        globalObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const target = entry.target as HTMLElement
                    const isOnce = target.getAttribute("data-once") === "true"

                    if (entry.isIntersecting) {
                        /**
                         * Problem 4 Fix: Avoid React state updates during scroll.
                         * Directly toggling DOM attributes prevents re-renders on every scroll transition.
                         */
                        target.setAttribute("data-visible", "true")
                        if (isOnce) {
                            globalObserver?.unobserve(target)
                        }
                    } else if (!isOnce) {
                        target.setAttribute("data-visible", "false")
                    }
                })
            },
            { threshold: 0.15 } // Standard threshold for consistent scroll reveal behavior
        )
    }
    return globalObserver
}

export function AdvancedScrollReveal({
    children,
    variant = "slideUp",
    delay = 0,
    duration = 0.5, // Fix 3: Snappier 0.5s default for better perceived performance
    className = "",
    once = true,
}: AdvancedScrollRevealProps) {
    const { enableMotion } = useMotion()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const node = ref.current
        if (!enableMotion || !node) return

        const obs = getGlobalObserver()
        if (obs) {
            node.setAttribute("data-once", once.toString())
            obs.observe(node)
        }

        return () => {
            if (node && obs) {
                obs.unobserve(node)
            }
        }
    }, [enableMotion, once])

    const variantClasses = {
        fadeIn: "opacity-0 data-[visible=true]:opacity-100",
        slideUp: "opacity-0 translate-y-8 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0",
        slideLeft: "opacity-0 -translate-x-8 data-[visible=true]:opacity-100 data-[visible=true]:translate-x-0",
        slideRight: "opacity-0 translate-x-8 data-[visible=true]:opacity-100 data-[visible=true]:translate-x-0",
        scaleUp: "opacity-0 scale-95 data-[visible=true]:opacity-100 data-[visible=true]:scale-100",
        rotate: "opacity-0 rotate-[-2deg] scale-95 data-[visible=true]:opacity-100 data-[visible=true]:rotate-0 data-[visible=true]:scale-100"
    }

    return (
        <div
            ref={ref}
            data-visible="false"
            className={cn(
                // Base container classes
                enableMotion && "reveal-container transition-all",

                // Problem 2 Fix: Apply will-change ONLY when the element is visible/animating
                enableMotion && "data-[visible=true]:will-change-[transform,opacity]",

                enableMotion && variantClasses[variant],
                className
            )}
            style={{
                // Fix 3: Use duration directly to avoid long-running animations
                transitionDuration: enableMotion ? `${duration}s` : undefined,
                transitionDelay: enableMotion ? `${delay}ms` : undefined,
                transitionTimingFunction: enableMotion ? "cubic-bezier(0.25, 0.1, 0.25, 1.0)" : undefined
            }}
        >
            {children}
        </div>
    )
}

// Helper function to handle class merging
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}
