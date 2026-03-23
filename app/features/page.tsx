"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, CloudOff, FileText, Shield, Store, Users, Truck, Wallet, ReceiptText, ScanLine, Upload, FileSpreadsheet, QrCode, UserCheck, Search } from "lucide-react"
import { Navbar } from "@/components/landing-page/Navbar"
import { SiteFooter } from "@/components/landing-page/SiteFooter"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { cn } from "@/lib/utils"
import { useDemoDashboardUrl } from "@/hooks/use-demo-dashboard-url"

type AuthContext = {
  isAuthenticated: boolean
  isGuest: boolean
  orgSlug: string | null
}

const topFeatures = [
  {
    title: "Works Offline",
    description: "Continue billing during internet cuts without stopping your counter. Every bill and entry is saved on your device first, then synced automatically when internet comes back.",
    icon: CloudOff,
    tone: "from-cyan-100 via-sky-50 to-white",
    iconBg: "bg-cyan-100/90",
    iconColor: "text-cyan-700"
  },
  {
    title: "GST Billing",
    description: "Create GST-ready invoices in a few clicks with clean tax breakup and clear totals. This helps you avoid confusion during filing and keeps records easy to verify later.",
    icon: FileText,
    tone: "from-emerald-100 via-lime-50 to-white",
    iconBg: "bg-emerald-100/90",
    iconColor: "text-emerald-700"
  },
  {
    title: "Inventory Control",
    description: "Track stock movement after every sale so your numbers stay accurate through the day. Get low-stock visibility early and update prices or item details quickly from one place.",
    icon: Store,
    tone: "from-sky-100 via-cyan-50 to-white",
    iconBg: "bg-sky-100/90",
    iconColor: "text-sky-700"
  },
]

const featureCards = [
  {
    title: "Khata & Customers",
    description: "Manage customer dues, add payment entries, and keep ledger history in one view. Follow-ups stay organized so nothing gets missed even during rush hours.",
    icon: Users,
    tone: "from-amber-100 via-orange-50 to-white",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700"
  },
  {
    title: "Analytics",
    description: "View daily sales trends, top-selling products, and category performance in a simple format. Use this to plan purchases better and adjust pricing with more confidence.",
    icon: BarChart3,
    tone: "from-teal-100 via-cyan-50 to-white",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700"
  },
  {
    title: "Data Security",
    description: "Your business data is encrypted and protected with role-based access controls. That means sensitive information is visible only to the right team members.",
    icon: Shield,
    tone: "from-cyan-100 via-blue-50 to-white",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-700"
  },
  {
    title: "Supplier Management",
    description: "Maintain supplier details, track purchases, and record supplier payments in one organized flow.",
    icon: Truck,
    tone: "from-emerald-100 via-teal-50 to-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700"
  },
  {
    title: "Expense Tracking",
    description: "Log daily business expenses and keep spending records ready for review at any time.",
    icon: Wallet,
    tone: "from-sky-100 via-cyan-50 to-white",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700"
  },
  {
    title: "Sales Reports",
    description: "Review sales summaries and trends quickly so you can spot what is growing and what needs attention.",
    icon: ReceiptText,
    tone: "from-violet-100 via-fuchsia-50 to-white",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700"
  },
  {
    title: "Fast Billing UI",
    description: "A clean billing interface with quick item search and scan support to speed up checkout.",
    icon: ScanLine,
    tone: "from-cyan-100 via-sky-50 to-white",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-700"
  },
  {
    title: "Excel Import",
    description: "Import inventory and customer data from files so you can start faster without manual entry.",
    icon: Upload,
    tone: "from-emerald-100 via-lime-50 to-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700"
  },
  {
    title: "GST Reports",
    description: "Access GST-focused reports in a structured format when you need tax summaries and filing support.",
    icon: FileSpreadsheet,
    tone: "from-sky-100 via-indigo-50 to-white",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700"
  },
  {
    title: "UPI on Bills",
    description: "Show UPI payment details on invoices to make customer payments quick and convenient.",
    icon: QrCode,
    tone: "from-rose-100 via-pink-50 to-white",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700"
  },
  {
    title: "Team Access",
    description: "Assign staff access by role so everyone can do their work with the right level of permission.",
    icon: UserCheck,
    tone: "from-cyan-100 via-teal-50 to-white",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-700"
  },
  {
    title: "Quick Search",
    description: "Find products, customers, and records quickly so daily operations stay smooth during rush hours.",
    icon: Search,
    tone: "from-emerald-100 via-cyan-50 to-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700"
  }
]

export default function FeaturesPage() {
  const [auth, setAuth] = useState<AuthContext>({
    isAuthenticated: false,
    isGuest: false,
    orgSlug: null,
  })

  useEffect(() => {
    let isMounted = true
    const loadAuth = async () => {
      try {
        const response = await fetch("/api/auth/context", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as AuthContext
        if (isMounted) {
          setAuth({
            isAuthenticated: !!data.isAuthenticated,
            isGuest: !!data.isGuest,
            orgSlug: data.orgSlug || null,
          })
        }
      } catch {
        // keep defaults
      }
    }
    loadAuth()
    return () => { isMounted = false }
  }, [])

  const ctaHref = auth.isAuthenticated ? (auth.orgSlug ? `/${auth.orgSlug}/dashboard` : "/dashboard") : "/auth/sign-up"
  const demoDashboardUrl = useDemoDashboardUrl()

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.9),transparent_28%),radial-gradient(circle_at_top_right,rgba(186,230,253,0.72),transparent_32%),linear-gradient(180deg,#f3fff9_0%,#f8fdff_38%,#f7fbff_72%,#f4fbff_100%)] text-zinc-900">
      <Navbar
        isAuthenticated={auth.isAuthenticated}
        isLight={true}
        orgSlug={auth.orgSlug}
        isGuest={auth.isGuest}
        forcePublicActions={true}
      />

      <section className="relative px-6 pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-10 h-[420px] w-[520px] rounded-full bg-emerald-200/55 blur-[120px]" />
          <div className="absolute top-10 right-0 h-[360px] w-[480px] rounded-full bg-cyan-200/48 blur-[150px]" />
          <div className="absolute left-1/3 top-16 h-[260px] w-[260px] rounded-full bg-violet-200/32 blur-[130px]" />
          <div className="absolute right-1/4 top-40 h-[200px] w-[200px] rounded-full bg-amber-200/28 blur-[110px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <AdvancedScrollReveal variant="slideUp">
            <div className="space-y-6 px-2 py-4 md:px-4 md:py-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                Zero-Risk Trial
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-zinc-900">
                Start billing without hurdles.
                <span className="block bg-gradient-to-r from-teal-700 via-emerald-600 to-sky-700 bg-clip-text text-transparent">
                  No credit card required.
                </span>
              </h1>
              <p className="text-lg text-zinc-600 max-w-2xl">
                Spin up invoices, stock, and khata in minutes. Keep every rupee clear with synced sales, exports, and GST-ready docs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700"
                >
                  Start Free Now
                </Link>
                <Link
                  href={demoDashboardUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-7 py-3.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  See Demo <ArrowRight size={16} className="text-emerald-500" />
                </Link>
                <span className="text-[12px] font-semibold text-zinc-500 sm:ml-3">14-day free trial · cancel anytime</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
                {[
                  { label: "Avg. setup time", value: "6 min" },
                  { label: "Offline billing", value: "Works without internet" },
                  { label: "GST-ready invoices", value: "Create GST bills fast" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/80 bg-white/88 p-4 shadow-[0_18px_40px_-28px_rgba(14,116,144,0.22)]">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{item.label}</div>
                    <div className="text-xl font-black text-zinc-900 mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </AdvancedScrollReveal>

        </div>
      </section>

      <section className="relative px-6 pb-8 md:pb-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-10 h-[220px] w-[220px] rounded-full bg-cyan-200/24 blur-[120px]" />
          <div className="absolute right-12 bottom-0 h-[240px] w-[240px] rounded-full bg-emerald-200/22 blur-[120px]" />
        </div>
        <AdvancedScrollReveal variant="slideUp">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-cyan-200/80 bg-gradient-to-br from-cyan-100 via-sky-50 to-emerald-50/80 p-8 shadow-[0_24px_60px_-34px_rgba(8,145,178,0.3)] md:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">
                  Billing does not stop when internet drops.
                </h2>
                <p className="mt-3 text-lg text-zinc-700">
                  Built for patchy connections. Keep selling in offline mode and sync safely when the network is back.
                </p>
              </div>
              <Link href={ctaHref} className="inline-flex h-12 items-center justify-center rounded-xl bg-cyan-700 px-6 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-cyan-800">
                Try Offline Billing
              </Link>
            </div>
          </div>
        </AdvancedScrollReveal>
      </section>

      <section className="px-6 pb-8 md:pb-10 relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 w-[260px] h-[260px] bg-emerald-200/35 blur-[120px]" />
          <div className="absolute right-0 bottom-0 w-[280px] h-[280px] bg-sky-200/35 blur-[120px]" />
          <div className="absolute left-1/3 top-0 w-[220px] h-[220px] bg-amber-200/25 blur-[110px]" />
          <div className="absolute right-1/3 top-12 w-[220px] h-[220px] bg-violet-200/22 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-6xl relative z-10">
          <h2 className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Top Features</h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {topFeatures.map((card, idx) => {
              const Icon = card.icon
              const spanClass = idx === 0 ? "lg:col-span-6" : "lg:col-span-3"
              return (
                <AdvancedScrollReveal key={card.title} variant="slideUp" delay={idx * 60} className={spanClass}>
                  <article className={`group relative h-full overflow-hidden rounded-[2rem] border border-white/85 bg-gradient-to-br ${card.tone} p-8 shadow-[0_24px_54px_-30px_rgba(14,116,144,0.2)] backdrop-blur-xl`}>
                      <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/70" />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.85),transparent_42%)]" />
                      <div className="relative z-10">
                      <div className={cn("mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 shadow-sm", card.iconBg, card.iconColor)}>
                        <Icon size={26} />
                      </div>
                      <h3 className="text-3xl font-black tracking-tight text-zinc-900">{card.title}</h3>
                      <p className="mt-3 text-[17px] leading-relaxed text-zinc-700">{card.description}</p>
                    </div>
                  </article>
                </AdvancedScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-10 md:pb-16 relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[480px] h-[480px] bg-violet-200/28 blur-[200px]" />
          <div className="absolute left-0 top-16 w-[280px] h-[280px] bg-cyan-200/24 blur-[140px]" />
          <div className="absolute right-0 bottom-0 w-[320px] h-[320px] bg-emerald-200/24 blur-[150px]" />
          <div className="absolute left-1/4 bottom-0 w-[260px] h-[260px] bg-amber-200/18 blur-[130px]" />
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 relative z-10">
          {featureCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <AdvancedScrollReveal key={card.title} variant="slideUp" delay={idx * 40}>
                <article className={`group relative overflow-hidden rounded-[2rem] border border-white/85 bg-gradient-to-br ${card.tone} p-7 shadow-[0_22px_48px_-30px_rgba(14,116,144,0.18)] backdrop-blur-xl`}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.95),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.55),transparent_34%)]" />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/70" />
                  <div className="relative z-10">
                    <div className={cn("mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 shadow-sm backdrop-blur-md", card.iconBg, card.iconColor)}>
                      <Icon size={24} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900">{card.title}</h2>
                    <p className="mt-3 text-[17px] leading-relaxed text-zinc-600">{card.description}</p>
                  </div>
                </article>
              </AdvancedScrollReveal>
            )
          })}
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-cyan-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(236,254,255,0.88),rgba(239,246,255,0.92))] px-6 py-5 text-center shadow-[0_20px_50px_-34px_rgba(14,116,144,0.18)] backdrop-blur-sm">
          <p className="text-sm font-semibold text-zinc-600">
            Disclaimer: Some features shown on this page are currently in testing and may not be available in every account yet.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
