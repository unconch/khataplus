"use client"

import { useEffect, useRef, useState } from "react"
import { useAnimationControls, useInView, useReducedMotion } from "framer-motion"

export type DeviceMetrics = {
  sales: number
  stock: number
  customers: number
  progress: number
}

const BASE_DESKTOP: DeviceMetrics = {
  sales: 18400,
  stock: 420000,
  customers: 1202,
  progress: 0.64,
}

const BASE_TABLET: DeviceMetrics = {
  sales: 9200,
  stock: 198000,
  customers: 438,
  progress: 0.56,
}

const BASE_MOBILE: DeviceMetrics = {
  sales: 8402,
  stock: 84000,
  customers: 186,
  progress: 0.62,
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function animateMetric(
  from: DeviceMetrics,
  to: DeviceMetrics,
  durationMs: number,
  update: (next: DeviceMetrics) => void,
  shouldStop: () => boolean,
) {
  return new Promise<void>((resolve) => {
    const start = performance.now()

    const step = (now: number) => {
      if (shouldStop()) {
        resolve()
        return
      }

      const p = Math.min((now - start) / durationMs, 1)
      const e = easeOutCubic(p)

      update({
        sales: Math.round(from.sales + (to.sales - from.sales) * e),
        stock: Math.round(from.stock + (to.stock - from.stock) * e),
        customers: Math.round(from.customers + (to.customers - from.customers) * e),
        progress: from.progress + (to.progress - from.progress) * e,
      })

      if (p < 1) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(step)
  })
}

export function useHeroAnimation() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { margin: "-100px" })
  const prefersReducedMotion = useReducedMotion()

  const desktopControls = useAnimationControls()
  const tabletControls = useAnimationControls()
  const mobileControls = useAnimationControls()
  const saleControls = useAnimationControls()
  const syncControls = useAnimationControls()

  const [desktop, setDesktop] = useState<DeviceMetrics>(BASE_DESKTOP)
  const [tablet, setTablet] = useState<DeviceMetrics>(BASE_TABLET)
  const [mobile, setMobile] = useState<DeviceMetrics>(BASE_MOBILE)

  const [isLg, setIsLg] = useState(true)

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)")
    const apply = () => setIsLg(query.matches)
    apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setDesktop(BASE_DESKTOP)
      setTablet(BASE_TABLET)
      setMobile(BASE_MOBILE)
      return
    }

    if (!inView) return

    let cancelled = false

    const stop = () => cancelled || !inView

    const run = async () => {
      while (!cancelled) {
        // Phase 1 (0-1s desktop, 0-1.2s mobile): count-up
        const countTarget: DeviceMetrics = {
          sales: BASE_DESKTOP.sales + 320,
          stock: BASE_DESKTOP.stock,
          customers: BASE_DESKTOP.customers + 3,
          progress: 0.68,
        }

        await animateMetric(
          BASE_DESKTOP,
          countTarget,
          isLg ? 800 : 1200,
          setDesktop,
          stop,
        )

        if (stop()) break

        // Phase 2 (1-2.5s): sale event + stock drop + progress scaleX update via state
        await saleControls.start({
          scale: [1, 1.02, 1],
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        })

        setDesktop((prev) => ({
          ...prev,
          sales: prev.sales + 420,
          stock: prev.stock - 1200,
          progress: 0.8,
        }))

        await delay(700)
        if (stop()) break

        // Phase 3 (2.5-3s): sync pulse
        await syncControls.start({
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 0.6, ease: "easeInOut" },
        })

        // Phase 4 (3-4s): cross-device sync (desktop only)
        if (isLg) {
          await desktopControls.start({ scale: [1, 1.01, 1], transition: { duration: 0.35, ease: "easeInOut" } })

          await delay(200)
          setTablet((prev) => ({
            ...prev,
            sales: prev.sales + 140,
            stock: prev.stock - 280,
            customers: prev.customers + 1,
            progress: Math.min(0.88, prev.progress + 0.05),
          }))
          await tabletControls.start({
            scale: [1, 1.015, 1],
            transition: { duration: 0.35, ease: "easeInOut" },
          })

          await delay(200)
          setMobile((prev) => ({
            ...prev,
            sales: prev.sales + 60,
            stock: prev.stock - 90,
            customers: prev.customers + 1,
            progress: Math.min(0.9, prev.progress + 0.04),
          }))
          await mobileControls.start({
            scale: [1, 1.02, 1],
            transition: { duration: 0.35, ease: "easeInOut" },
          })
        } else {
          setMobile((prev) => ({
            ...prev,
            sales: prev.sales + 120,
            stock: prev.stock - 150,
            customers: prev.customers + 1,
            progress: Math.min(0.9, prev.progress + 0.06),
          }))
          await mobileControls.start({
            scale: [1, 1.02, 1],
            transition: { duration: 0.4, ease: "easeInOut" },
          })
        }

        // Phase 5 (4-8s): idle breathing
        await Promise.all([
          desktopControls.start({
            scale: [1, 1.01, 1],
            transition: { duration: 4, ease: "easeInOut" },
          }),
          tabletControls.start({
            scale: [1, 1.01, 1],
            transition: { duration: 4, ease: "easeInOut" },
          }),
          mobileControls.start({
            scale: [1, 1.01, 1],
            transition: { duration: 4, ease: "easeInOut" },
          }),
        ])

        setDesktop(BASE_DESKTOP)
        setTablet(BASE_TABLET)
        setMobile(BASE_MOBILE)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [desktopControls, inView, isLg, mobileControls, prefersReducedMotion, saleControls, syncControls, tabletControls])

  return {
    ref,
    inView,
    isLg,
    desktop,
    tablet,
    mobile,
    controls: {
      desktop: desktopControls,
      tablet: tabletControls,
      mobile: mobileControls,
      sale: saleControls,
      sync: syncControls,
    },
  }
}
