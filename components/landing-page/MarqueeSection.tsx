"use client"

import { motion } from "framer-motion"

const WORDS = [
    "RETAIL", "WHOLESALE", "PHARMACY", "TEXTILES", "ELECTRONICS",
    "FMCG", "HARDWARE", "DISTRIBUTION", "SERVICES", "MANUFACTURING"
]

export function MarqueeSection() {
    return (
        <section className="py-10 md:py-12 bg-transparent overflow-hidden relative flex items-center">
            {/* Kinetic Typography Marquee */}
            <div className="flex whitespace-nowrap overflow-hidden items-center group">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="flex gap-8 items-center pr-8 w-max"
                >
                    {/* Double the array for seamless looping */}
                    {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((word, i) => (
                        <div key={i} className="flex items-center gap-8">
                            <span className={`text-4xl md:text-5xl lg:text-[4rem] font-black uppercase tracking-tighter ${i % 3 === 0 ? 'text-zinc-900' :
                                i % 3 === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400' :
                                    'text-transparent [-webkit-text-stroke:1px_#a1a1aa] opacity-60'
                                }`}>
                                {word}
                            </span>
                            <span className="text-zinc-300 mx-4 text-3xl">✦</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
