"use client"

import { useEffect, useRef, useState } from "react"

export function SplitText({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) {
    const words = text.split(" ")
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true)
                if (ref.current) observer.unobserve(ref.current)
            }
        }, { threshold: 0.1 })
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    let charCount = 0

    return (
        <span ref={ref} className={`${className} inline-block`}>
            {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.2em]">
                    {word.split("").map((char, charIndex) => {
                        const style = {
                            transitionDelay: `${delay + (charCount * 30)}ms`,
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                            transitionProperty: 'opacity, transform',
                            transitionDuration: '500ms',
                            transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)'
                        }
                        charCount++
                        return (
                            <span
                                key={charIndex}
                                className="inline-block will-change-[transform,opacity]"
                                style={style}
                            >
                                {char}
                            </span>
                        )
                    })}
                </span>
            ))}
        </span>
    )
}
