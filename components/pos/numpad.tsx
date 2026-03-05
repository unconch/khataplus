"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface NumpadProps {
  onConfirm: (amount: number) => void
  onCancel: () => void
  total: number
  title?: string
}

export function Numpad({ onConfirm, onCancel, total, title = "Amount Tendered" }: NumpadProps) {
  const [displayValue, setDisplayValue] = useState("")

  const parsedAmount = Number.parseFloat(displayValue || "0") || 0
  const changeAmount = Math.max(0, parsedAmount - total)

  const handleKeyPress = useCallback((key: string) => {
    setDisplayValue((prev) => {
      if (prev === "0") return key
      if (prev.length >= 10) return prev
      return prev + key
    })
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm(parsedAmount)
  }, [onConfirm, parsedAmount])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKeyPress(e.key)
      if (e.key === "Backspace") {
        setDisplayValue((v) => (v.length > 1 ? v.slice(0, -1) : ""))
      }
      if (e.key === "Escape") onCancel()
      if (e.key === "Enter") handleConfirm()
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleConfirm, handleKeyPress, onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[2.2rem] border border-white/15 bg-zinc-950/95 p-7 shadow-[0_0_60px_rgba(0,0,0,0.55)]"
      >
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="mb-6 text-center">
          <h2 className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-500">{title}</h2>
          <p className="text-5xl font-black italic tracking-tighter text-white">
            ₹{parsedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total</p>
            <p className="mt-1 text-2xl font-black text-zinc-200">₹{total.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Change</p>
            <p className={cn("mt-1 text-2xl font-black", changeAmount > 0 ? "text-emerald-300" : "text-zinc-200")}>
              ₹{changeAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, "00", "⌫"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                if (num === "⌫") {
                  setDisplayValue((v) => (v.length > 1 ? v.slice(0, -1) : ""))
                } else if (num === "00") {
                  setDisplayValue((v) => (v === "" ? "0" : `${v}00`))
                } else {
                  handleKeyPress(String(num))
                }
              }}
              className={cn(
                "flex h-16 items-center justify-center rounded-2xl border text-2xl font-black transition active:scale-90",
                num === "⌫"
                  ? "border-rose-400/25 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
                  : "border-white/10 bg-white/[0.04] text-zinc-100 hover:border-white/20 hover:bg-white/[0.08]"
              )}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-13 rounded-xl border border-white/15 bg-white/[0.05] text-xs font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-13 rounded-xl bg-emerald-500 text-xs font-black uppercase tracking-widest text-black shadow-[0_12px_24px_-8px_rgba(16,185,129,0.45)] transition hover:bg-emerald-400"
          >
            Confirm Payment
          </button>
        </div>
      </motion.div>
    </div>
  )
}
