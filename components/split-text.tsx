"use client"

import { motion } from "framer-motion"

export function SplitText({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) {
    const words = text.split(" ")

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: delay * 0.04 }
        })
    }

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100
            }
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100
            }
        }
    }

    return (
        <motion.span
            className={`${className} inline-block`}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            {words.map((word, index) => (
                <span key={index} className="inline-block whitespace-nowrap mr-[0.2em]">
                    {word.split("").map((char, charIndex) => (
                        <motion.span
                            key={charIndex}
                            variants={child}
                            className="inline-block"
                        >
                            {char}
                        </motion.span>
                    ))}
                </span>
            ))}
        </motion.span>
    )
}
