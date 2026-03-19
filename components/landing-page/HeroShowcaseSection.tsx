import { TrendingUp, DollarSign, Smartphone } from "lucide-react"

const SIDEBAR_LINES = [1, 2, 3, 4, 5]
const CHART_BARS = [40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85, 30, 75, 50, 90, 60, 40, 70, 50]
const PHONE_ROWS = [1, 2, 3]

export function HeroShowcaseSection() {
  return (
    <section className="relative py-8 md:py-10 bg-transparent">
      <div className="pointer-events-none absolute top-0 inset-x-0 h-28 z-[1] bg-gradient-to-b from-white via-white/65 to-transparent" />
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-30%] left-[-20%] w-[120vw] h-[120vw] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,rgba(16,185,129,0.05)_40%,transparent_70%)] blur-[120px] rounded-full" />
        <div className="absolute top-[-25%] right-[-20%] w-[110vw] h-[110vw] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14)_0%,rgba(99,102,241,0.04)_50%,transparent_70%)] blur-[140px] rounded-full" />
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

        <div className="relative w-full max-w-6xl mx-auto min-h-[520px] flex items-center justify-center z-10 overflow-visible">
          <div className="relative w-full max-w-5xl bg-white/50 border border-zinc-200/60 rounded-[3rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] p-2">
            <div className="bg-white rounded-[2.8rem] border border-zinc-100 overflow-hidden flex flex-col h-full min-h-[460px]">
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
                      <div key={i} className="h-3 bg-zinc-100 rounded-full" style={{ width: `${80 - i * 5}%` }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <MetricCard label="Total Sales" value="Rs24.8L" color="text-emerald-600" />
                    <MetricCard label="Receivables" value="Rs3.2L" color="text-rose-600" />
                    <MetricCard label="Stock Value" value="Rs12.5L" color="text-indigo-600" />
                  </div>
                  <div className="h-48 rounded-3xl bg-zinc-50/50 border border-zinc-100 flex items-end p-6 gap-2 pt-16 relative overflow-hidden">
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="h-2 w-24 bg-zinc-200 rounded-full" />
                      <TrendingUp size={14} className="text-emerald-500" />
                    </div>
                    {CHART_BARS.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-zinc-200 hover:bg-emerald-400 transition-colors duration-300 rounded-t-[2px]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 md:-right-12 -bottom-8 w-[260px] h-[520px] bg-white border border-zinc-200 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-1.5 z-20 hidden lg:block">
            <div className="h-full bg-white rounded-[2.8rem] overflow-hidden relative flex flex-col border border-zinc-100 shrink-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-100 rounded-b-2xl z-20" />

              <div className="p-5 pt-12 flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-2">
                    <div className="h-2 w-20 bg-zinc-800 rounded-full" />
                    <div className="h-3 w-12 bg-zinc-200 rounded-full" />
                  </div>
                </div>

                <div className="h-40 rounded-[2rem] bg-emerald-500 p-6 flex flex-col justify-between text-white relative overflow-hidden shadow-lg shadow-emerald-500/20 mb-4">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden" />
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Synced Sales</div>
                    <div className="text-3xl font-black tabular-nums">Rs2,450</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {PHONE_ROWS.map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center px-4 gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400">
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
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-20 z-[5] bg-gradient-to-b from-transparent via-[#fafafa]/40 to-[#fafafa]" />
    </section>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/50 border border-zinc-100 p-6 rounded-3xl hover:shadow-lg transition-all duration-500">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">{label}</div>
      <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
    </div>
  )
}
