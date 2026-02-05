"use client"

import { motion, useScroll, useSpring } from "framer-motion"

export function ScrollProgressBar() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1.5 z-[100] origin-left bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500"
            style={{ scaleX }}
        />
    )
}
