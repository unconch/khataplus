"use client"

import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { DeviceCluster } from "./DeviceCluster"

type HeroSectionProps = {
  isAuthenticated: boolean
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth/sign-up"
  const secondaryHref = "/demo/dashboard"

  return (
    <section className="relative min-h-[78svh] flex items-center bg-white text-zinc-900 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(circle_at_center,_black_1px,_transparent_1px)] bg-[size:28px_28px]" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16">
        <div className="grid lg:grid-cols-[1.1fr_1fr] items-center gap-16">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase italic text-zinc-900">
              GST Billing <br />
              <span className="text-blue-600">Advance Khata</span>
            </h1>

            <p className="max-w-xl text-lg text-zinc-600 leading-relaxed">
              Manage billing, ledger, inventory and GST in one calm workspace for your daily operations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs uppercase tracking-widest font-bold text-zinc-600">
              <span>GST & Non-GST Billing</span>
              <span>Automated Credit Reminders</span>
              <span>Offline Billing Mode</span>
              <span>Daily Profit Reports</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 py-4 text-[12px] font-black uppercase tracking-widest text-white transition-colors hover:bg-blue-700"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-8 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-50"
              >
                <Play className="h-4 w-4 fill-zinc-900 stroke-0" />
                Login to Dashboard
              </Link>
            </div>
          </div>

          <DeviceCluster />
        </div>
      </div>
    </section>
  )
}
