"use client"

import { motion } from "framer-motion"
import type { DeviceMetrics } from "./useHeroAnimation"

type TabletDeviceProps = {
  metrics: DeviceMetrics
  controls: any
}

function formatCompact(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`
  return value.toLocaleString("en-IN")
}

export function TabletDevice({ metrics, controls }: TabletDeviceProps) {
  return (
    <motion.div
      animate={controls}
      className="relative w-[380px] bg-zinc-50 rounded-[28px] border-[8px] border-zinc-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden transform-gpu"
      style={{ willChange: "transform" }}
    >
      {/* Tablet Camera Dot */}
      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-700/50 z-20 shadow-inner" />

      <div className="p-5 pt-7 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-wide text-zinc-500">Sales</div>
            <div className="mt-1 text-2xl font-black italic text-zinc-900">{formatCompact(metrics.sales)}</div>
          </div>
          <div className="rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-wide text-zinc-500">Stock</div>
            <div className="mt-1 text-2xl font-black italic text-zinc-900">{formatCompact(metrics.stock)}</div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
          <div className="h-3 rounded-full bg-zinc-100 overflow-hidden shadow-inner w-full">
            <div
              className="h-full bg-blue-400 origin-left transform-gpu"
              style={{ transform: `scaleX(${metrics.progress})`, willChange: "transform" }}
            />
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
            <div className="h-8 w-8 rounded bg-zinc-100" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-full bg-zinc-100 rounded-full" />
              <div className="h-2.5 w-1/2 bg-zinc-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Home Bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/4 h-[3px] bg-zinc-300 rounded-full z-20" />
    </motion.div>
  )
}
