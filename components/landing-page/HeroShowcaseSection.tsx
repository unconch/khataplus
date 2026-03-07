"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Smartphone,
} from "lucide-react"

const SIDEBAR_LINES = [1, 2, 3, 4, 5]
const CHART_BARS = [40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85, 30, 75, 50, 90, 60, 40, 70, 50]
const PHONE_ROWS = [1, 2, 3]

export function HeroShowcaseSection() {
  return (
    <section className="relative py-8 md:py-10 overflow-visible bg-transparent">
      <div className="pointer-events-none absolute top-0 inset-x-0 h-28 z-[1] bg-gradient-to-b from-white via-white/65 to-transparent" />
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{ x: ["-10%", "5%", "-10%"], y: ["-5%", "5%", "-5%"], scale: [1, 1.08, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-30%] left-[-20%] w-[120vw] h-[120vw] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0.07)_40%,transparent_70%)] blur-[150px] rounded-full"
        />
        <motion.div
          animate={{ x: ["8%", "-8%", "8%"], y: ["5%", "-5%", "5%"], scale: [1.08, 1, 1.08] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-[-25%] right-[-20%] w-[110vw] h-[110vw] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.05)_50%,transparent_70%)] blur-[180px] rounded-full"
        />
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-8">
          <p className="text-zinc-900 text-2xl md:text-4xl font-bold tracking-tight mt-1">
            Smart billing for Indian business.
          </p>
          <p className="text-zinc-600 text-lg md:text-2xl leading-relaxed tracking-tight">
            Start on desktop, finish on mobile.
          </p>
        </div>

        <div className="relative w-full max-w-6xl mx-auto min-h-[560px] flex items-center justify-center z-10 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl bg-white/40 backdrop-blur-3xl border border-zinc-200/50 rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] p-2 group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 -z-10" />

            <div className="bg-white rounded-[2.8rem] border border-zinc-100 overflow-hidden flex flex-col h-full min-h-[480px]">
              <div className="h-14 flex items-center justify-between px-8 border-b border-zinc-50 bg-zinc-50/30">
                <div className="flex gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">khata.plus / dashboard</div>
                <div className="w-10" />
              </div>

              <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12 text-left">
                <div className="hidden md:block space-y-8 pt-2">
                  <div className="h-10 w-full bg-emerald-50 rounded-2xl border border-emerald-100/50" />
                  <div className="space-y-4">
                    {SIDEBAR_LINES.map((i) => (
                      <div key={i} className="h-3 w-full bg-zinc-100 rounded-full" style={{ width: `${80 - i * 5}%` }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <MetricCard label="Total Sales" value="₹24.8L" color="text-emerald-600" />
                    <MetricCard label="Receivables" value="₹3.2L" color="text-rose-600" />
                    <MetricCard label="Stock Value" value="₹12.5L" color="text-indigo-600" />
                  </div>
                  <div className="h-48 rounded-3xl bg-zinc-50/50 border border-zinc-100 flex items-end p-6 gap-2 pt-16 relative overflow-hidden">
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="h-2 w-24 bg-zinc-200 rounded-full" />
                      <TrendingUp size={14} className="text-emerald-500" />
                    </div>
                    {CHART_BARS.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1.5 + i * 0.04, duration: 1, ease: "easeOut" }}
                        className="flex-1 bg-zinc-200 hover:bg-emerald-400 transition-colors duration-300 rounded-t-[2px]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100, y: 50, rotate: 10 }}
            animate={{ opacity: 1, x: 0, y: 20, rotate: -4 }}
            transition={{ duration: 1.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -right-4 md:-right-12 -bottom-8 w-[260px] h-[520px] bg-white border border-zinc-200 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15),_0_0_0_8px_#fafafa] p-1.5 z-20 group/phone hidden lg:block"
          >
            <div className="h-full bg-white rounded-[2.8rem] overflow-hidden relative flex flex-col border border-zinc-100 shrink-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-100 rounded-b-2xl z-20" />

              <div className="p-5 pt-12 flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-2">
                    <div className="h-2 w-20 bg-zinc-800 rounded-full" />
                    <div className="h-3 w-12 bg-zinc-200 rounded-full" />
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-emerald-500">
                    <RefreshCw size={18} className="animate-spin-slow" />
                  </div>
                </div>

                <div className="h-40 rounded-[2rem] bg-emerald-500 p-6 flex flex-col justify-between text-white relative overflow-hidden group/card shadow-lg shadow-emerald-500/20 mb-4">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/3 bg-white/60"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Synced Sales</div>
                    <div className="text-3xl font-black tabular-nums">₹2,450</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {PHONE_ROWS.map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center px-4 gap-4 shadow-sm group/item">
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover/item:text-emerald-500 transition-colors">
                        <DollarSign size={18} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-2 w-full bg-zinc-200 rounded-full" />
                        <div className="h-2 w-2/3 bg-zinc-100 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-center">
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={10} /> Pocket Intelligence Ready
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-20 z-[5] bg-gradient-to-b from-transparent via-[#fafafa]/40 to-[#fafafa]" />

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }
      `}</style>
    </section>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-zinc-100 p-6 rounded-3xl hover:shadow-lg transition-all duration-500">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">{label}</div>
      <div className={cn("text-2xl font-black tracking-tight", color)}>{value}</div>
    </div>
  )
}

