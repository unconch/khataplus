"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { DeviceMetrics } from "./useHeroAnimation"

type DesktopDeviceProps = {
  metrics: DeviceMetrics
  controls: {
    frame: any
    sale: any
    sync: any
  }
}

function formatCompact(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`
  return value.toLocaleString("en-IN")
}

export function DesktopDevice({ metrics, controls }: DesktopDeviceProps) {
  return (
    <motion.div
      animate={controls.frame}
      className="relative w-[600px] bg-white rounded-xl border border-zinc-200/80 shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden transform-gpu flex flex-col"
      style={{ willChange: "transform" }}
    >
      {/* Browser Frame Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border-b border-zinc-100 z-10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-zinc-200 text-[10px] text-zinc-400 font-medium px-4 py-1 rounded-md w-64 text-center truncate shadow-sm">
            khataplus.app/dashboard
          </div>
        </div>
        <div className="w-10" /> {/* Spacer to balance dots */}
      </div>

      <div className="p-6 space-y-5 bg-zinc-50/50">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Daily Sale", value: formatCompact(metrics.sales), tone: "border-blue-200 bg-blue-50/40 shadow-sm" },
            { label: "Item Stock", value: formatCompact(metrics.stock), tone: "border-black/5 bg-white shadow-sm" },
            { label: "Customer List", value: metrics.customers.toLocaleString("en-IN"), tone: "border-black/5 bg-white shadow-sm" },
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              animate={idx === 0 ? controls.sale : undefined}
              className={cn("rounded-xl border px-5 py-4 transform-gpu", card.tone)}
              style={{ willChange: idx === 0 ? "transform" : undefined }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{card.label}</div>
              <div className="mt-1 text-3xl leading-none font-black italic text-zinc-900">{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-xl border border-black/5 bg-white shadow-sm p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-2.5 w-36 rounded-full bg-zinc-100" />
            <motion.div
              animate={controls.sync}
              className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 transform-gpu flex items-center justify-center"
              style={{ willChange: "transform" }}
            >
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </motion.div>
          </div>

          <div className="space-y-4">
            {["bg-emerald-400", "bg-blue-400", "bg-zinc-300"].map((tone, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg border border-black/5 bg-zinc-50" />
                <div className="h-2.5 flex-1 rounded-full bg-zinc-100 overflow-hidden">
                  <motion.div
                    className={cn("h-full origin-left transform-gpu", tone)}
                    style={{ transform: `scaleX(${Math.max(0.2, metrics.progress - idx * 0.1)})`, willChange: "transform" }}
                  />
                </div>
                <div className="h-2.5 w-14 rounded-full bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
