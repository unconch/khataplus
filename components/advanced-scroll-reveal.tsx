"use client"

import { useRef, useEffect, useState } from "react"

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
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    if (once && ref.current) {
                        observer.unobserve(ref.current)
                    }
                } else if (!once) {
                    setIsVisible(false)
                }
            },
            { threshold }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [once, threshold])

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
            data-visible={isVisible}
            className={cn(
                "reveal-container transition-all will-change-[transform,opacity]",
                variantClasses[variant],
                className
            )}
            style={{
                transitionDuration: `${duration * 1.5}s`,
                transitionDelay: `${delay}ms`,
                transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1.0)"
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
