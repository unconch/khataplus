"use client"

import { useEffect, useState } from "react"

export function ScrollProgressBar() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight
            const currentScroll = window.scrollY
            if (totalScroll > 0) {
                setProgress(currentScroll / totalScroll)
            }
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll() // Initial check
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div
            className="fixed top-0 left-0 right-0 h-1.5 z-[100] origin-left bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-transform duration-200 ease-out will-change-transform"
            style={{ transform: `scaleX(${progress})` }}
        />
    )
}
