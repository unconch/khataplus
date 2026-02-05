"use client"

import { useState, useEffect } from "react"
import { useSpring } from "framer-motion"

/**
 * Creates a position value that follows the mouse cursor.
 * @param intensity - How much the element moves relative to cursor from center (default 0.02)
 */
export function useMouseParallax(intensity: number = 0.02) {
    const x = useSpring(0, { stiffness: 400, damping: 90 })
    const y = useSpring(0, { stiffness: 400, damping: 90 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2

            const moveX = (e.clientX - centerX) * intensity
            const moveY = (e.clientY - centerY) * intensity

            x.set(moveX)
            y.set(moveY)
        }

        // Only run on desktop to save battery on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        if (!isMobile) {
            window.addEventListener("mousemove", handleMouseMove)
        }

        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [intensity, x, y])

    return { x, y }
}
