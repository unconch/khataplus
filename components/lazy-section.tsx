"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface LazySectionProps {
  children: ReactNode
}

export function LazySection({ children }: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "200px",
      }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  return <div ref={ref}>{visible ? children : null}</div>
}
