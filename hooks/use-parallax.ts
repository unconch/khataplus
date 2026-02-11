"use client"

import { useScroll, useTransform, useSpring, MotionValue } from "framer-motion"
import { useRef } from "react"

/**
 * Creates a parallax effect for an element based on scroll position.
 * @param distance - The distance in pixels the element should move relative to scroll.
 *                   Positive values move continuously (slower than scroll).
 *                   Negative values move against scroll (faster/inverse).
 */
export function useParallax(distance: number = 100) {
    const { scrollY } = useScroll()
    const transform = useTransform(scrollY, [0, 1000], [0, distance])
    return useSpring(transform, { stiffness: 400, damping: 90 });
}
