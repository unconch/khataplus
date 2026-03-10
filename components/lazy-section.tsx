"use client"

import { useEffect, useRef, useState } from "react"

interface LazySectionProps {
  children: React.ReactNode
  height?: string
}

export function LazySection({ children, height = "400px" }: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "300px", // Load 300px before user reaches the section
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height }} />}
    </div>
  )
}
