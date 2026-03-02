"use client"

import { motion } from "framer-motion"
import { Layout, Layers, Cloud, Shield } from "lucide-react"
import type { DeviceMetrics } from "./useHeroAnimation"

type MobileDeviceProps = {
  metrics: DeviceMetrics
  controls: any
}

function formatCompact(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`
  return value.toLocaleString("en-IN")
}

export function MobileDevice({ metrics, controls }: MobileDeviceProps) {
  return (
    <motion.div
      animate={controls}
      className="relative w-[240px] bg-zinc-50 rounded-[36px] border-[6px] border-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden transform-gpu"
      style={{ willChange: "transform" }}
    >
      {/* Phone Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-900 rounded-b-2xl z-20 flex justify-center items-center pb-1">
        <div className="w-12 h-1.5 rounded-full bg-zinc-800" />
      </div>

      <div className="p-4 pt-10 pb-8 space-y-4 h-[460px]">
        <div className="rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Daily Balance</div>
          <div className="mt-1 text-2xl font-black italic leading-none text-blue-600">{formatCompact(metrics.sales)}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Layout, label: "Sale" },
            { icon: Layers, label: "Stock" },
            { icon: Cloud, label: "Cloud" },
            { icon: Shield, label: "Safe" },
          ].map((item) => (
            <div key={item.label} className="aspect-square rounded-xl border border-black/5 bg-white shadow-sm flex flex-col items-center justify-center gap-2">
              <item.icon size={18} className="text-zinc-600" />
              <span className="text-[9px] uppercase font-bold tracking-wide text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="h-3.5 rounded-full bg-zinc-100 overflow-hidden shadow-inner">
          <div
            className="h-full origin-left transform-gpu bg-emerald-400"
            style={{ transform: `scaleX(${metrics.progress})`, willChange: "transform" }}
          />
        </div>
      </div>

      {/* Home Bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-zinc-300 rounded-full z-20" />
    </motion.div>
  )
}
