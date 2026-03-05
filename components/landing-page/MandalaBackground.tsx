"use client"

import { motion } from "framer-motion"

export function MandalaBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
            <motion.div
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 180,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute -top-[20%] -right-[20%] w-[80%] aspect-square"
            >
                <MandalaSVG className="w-full h-full text-zinc-900 dark:text-white" />
            </motion.div>

            <motion.div
                animate={{
                    rotate: -360,
                }}
                transition={{
                    duration: 240,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute -bottom-[20%] -left-[20%] w-[60%] aspect-square"
            >
                <MandalaSVG className="w-full h-full text-zinc-900 dark:text-white" />
            </motion.div>
        </div>
    )
}

function MandalaSVG({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className={className}
        >
            <circle cx="100" cy="100" r="10" />
            <circle cx="100" cy="100" r="20" strokeDasharray="2 4" />

            {/* 12 Outer Circles */}
            {Array.from({ length: 12 }).map((_, i) => (
                <circle
                    key={`circle-${i}`}
                    cx={100 + 40 * Math.cos((i * 30 * Math.PI) / 180)}
                    cy={100 + 40 * Math.sin((i * 30 * Math.PI) / 180)}
                    r="15"
                />
            ))}

            {/* Geometric Lines */}
            {Array.from({ length: 24 }).map((_, i) => (
                <line
                    key={`line-${i}`}
                    x1="100"
                    y1="100"
                    x2={100 + 90 * Math.cos((i * 15 * Math.PI) / 180)}
                    y2={100 + 90 * Math.sin((i * 15 * Math.PI) / 180)}
                    strokeOpacity="0.5"
                />
            ))}

            <circle cx="100" cy="100" r="70" />
            <circle cx="100" cy="100" r="90" strokeWidth="0.2" />

            {/* Inscribed Polygon */}
            <path
                d={Array.from({ length: 8 }).reduce((acc, _, i) => {
                    const angle = (i * 45 * Math.PI) / 180
                    const x = 100 + 70 * Math.cos(angle)
                    const y = 100 + 70 * Math.sin(angle)
                    return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y} `
                }, '') + 'Z'}
                strokeOpacity="0.8"
            />
        </svg>
    )
}
