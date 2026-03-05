"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, CloudOff, CreditCard, FileText, Shield, Store, Users, Truck, Wallet, ReceiptText, ScanLine, Upload, FileSpreadsheet, QrCode, UserCheck, Search } from "lucide-react"
import { Navbar } from "@/components/landing-page/Navbar"
import { SiteFooter } from "@/components/landing-page/SiteFooter"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

type AuthContext = {
  isAuthenticated: boolean
  isGuest: boolean
  orgSlug: string | null
}

const featureCards = [
  {
    title: "Works Offline",
    description: "Continue billing during internet cuts without stopping your counter. Every bill and entry is saved on your device first, then synced automatically when internet comes back.",
    icon: CloudOff,
    tone: "from-cyan-100/60 to-white"
  },
  {
    title: "GST Billing",
    description: "Create GST-ready invoices in a few clicks with clean tax breakup and clear totals. This helps you avoid confusion during filing and keeps records easy to verify later.",
    icon: FileText,
    tone: "from-emerald-100/60 to-white"
  },
  {
    title: "Inventory Control",
    description: "Track stock movement after every sale so your numbers stay accurate through the day. Get low-stock visibility early and update prices or item details quickly from one place.",
    icon: Store,
    tone: "from-sky-100/60 to-white"
  },
  {
    title: "Khata & Customers",
    description: "Manage customer dues, add payment entries, and keep ledger history in one view. Follow-ups stay organized so nothing gets missed even during rush hours.",
    icon: Users,
    tone: "from-zinc-100 to-white"
  },
  {
    title: "Analytics",
    description: "View daily sales trends, top-selling products, and category performance in a simple format. Use this to plan purchases better and adjust pricing with more confidence.",
    icon: BarChart3,
    tone: "from-teal-100/60 to-white"
  },
  {
    title: "Data Security",
    description: "Your business data is encrypted and protected with role-based access controls. That means sensitive information is visible only to the right team members.",
    icon: Shield,
    tone: "from-cyan-100/50 to-white"
  },
  {
    title: "Supplier Management",
    description: "Maintain supplier details, track purchases, and record supplier payments in one organized flow.",
    icon: Truck,
    tone: "from-emerald-100/55 to-white"
  },
  {
    title: "Expense Tracking",
    description: "Log daily business expenses and keep spending records ready for review at any time.",
    icon: Wallet,
    tone: "from-sky-100/55 to-white"
  },
  {
    title: "Sales Reports",
    description: "Review sales summaries and trends quickly so you can spot what is growing and what needs attention.",
    icon: ReceiptText,
    tone: "from-zinc-100 to-white"
  },
  {
    title: "Fast Billing UI",
    description: "A clean billing interface with quick item search and scan support to speed up checkout.",
    icon: ScanLine,
    tone: "from-cyan-100/55 to-white"
  },
  {
    title: "Excel Import",
    description: "Import inventory and customer data from files so you can start faster without manual entry.",
    icon: Upload,
    tone: "from-emerald-100/55 to-white"
  },
  {
    title: "GST Reports",
    description: "Access GST-focused reports in a structured format when you need tax summaries and filing support.",
    icon: FileSpreadsheet,
    tone: "from-sky-100/55 to-white"
  },
  {
    title: "UPI on Bills",
    description: "Show UPI payment details on invoices to make customer payments quick and convenient.",
    icon: QrCode,
    tone: "from-zinc-100 to-white"
  },
  {
    title: "Team Access",
    description: "Assign staff access by role so everyone can do their work with the right level of permission.",
    icon: UserCheck,
    tone: "from-cyan-100/55 to-white"
  },
  {
    title: "Quick Search",
    description: "Find products, customers, and records quickly so daily operations stay smooth during rush hours.",
    icon: Search,
    tone: "from-emerald-100/50 to-white"
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6fbff_0%,#f8fbfa_48%,#ffffff_100%)] text-zinc-900 overflow-x-hidden">
      <Navbar
        isAuthenticated={auth.isAuthenticated}
        isLight={true}
        orgSlug={auth.orgSlug}
        isGuest={auth.isGuest}
      />

      <section className="relative px-6 pt-36 pb-16 md:pt-48 md:pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-200/30 blur-[100px]" />
          <div className="absolute top-24 right-[-120px] h-[320px] w-[320px] rounded-full bg-emerald-200/20 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <AdvancedScrollReveal variant="slideUp">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-zinc-600 backdrop-blur-md">
              <CreditCard size={13} className="text-cyan-600" />
              KHATAPLUS FEATURES
            </div>
            <h1 className="mt-8 text-5xl font-black tracking-[-0.04em] text-zinc-950 md:text-7xl leading-[0.95]">
              Built for Indian retail,
              <br />
              <span className="bg-gradient-to-r from-cyan-700 to-emerald-700 bg-clip-text text-transparent">
                designed for daily speed
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg font-medium leading-relaxed text-zinc-600 md:text-xl">
              KhataPlus brings billing, stock, khata, and reports into one simple workflow. Your team gets faster daily operations, clearer records, and fewer manual mistakes.
            </p>
          </AdvancedScrollReveal>
        </div>
      </section>

      <section className="px-6 pb-10 md:pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <AdvancedScrollReveal key={card.title} variant="slideUp" delay={idx * 40}>
                <article className={`group relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br ${card.tone} p-7 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl`}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.95),transparent_36%)]" />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/70" />
                  <div className="relative z-10">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/65 text-cyan-700 backdrop-blur-md">
                      <Icon size={22} />
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

      <section className="relative px-6 py-24 md:py-32 flex justify-center overflow-hidden">
        {/* Floating ambient colors behind */}
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
          <div className="absolute w-[400px] h-[400px] bg-fuchsia-100/80 rounded-full filter blur-[100px] -translate-x-1/2 -translate-y-1/4 animate-pulse" />
          <div className="absolute w-[400px] h-[400px] bg-cyan-100/80 rounded-full filter blur-[100px] translate-x-1/3 translate-y-1/4 animate-pulse opacity-75" style={{ animationDelay: "1s" }} />
          <div className="absolute w-[300px] h-[300px] bg-emerald-100/80 rounded-full filter blur-[100px] -translate-x-1/4 translate-y-1/3 animate-pulse opacity-60" style={{ animationDelay: "2s" }} />
        </div>

        <AdvancedScrollReveal variant="slideUp" className="w-full max-w-[800px] relative z-10">
          <div className="relative overflow-hidden rounded-[3rem] border border-white/80 bg-white/40 p-12 text-center backdrop-blur-3xl md:p-24 shadow-[0_8px_40px_rgba(0,0,0,0.04)] ring-1 ring-zinc-100/50">
            <div className="relative z-10">
              <h2 className="mx-auto max-w-md text-[2.5rem] font-medium leading-[1.1] tracking-tight text-zinc-900 md:text-[3.5rem] mb-12">
                Ready to run your business smarter?
              </h2>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={ctaHref}
                  className="inline-flex w-full items-center justify-center rounded-[1rem] bg-[#363636] px-8 py-3.5 text-[15px] font-medium text-white shadow-md transition-colors hover:bg-zinc-800 sm:w-auto"
                >
                  Start Free
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border border-zinc-200/60 bg-white/80 px-8 py-3.5 text-[15px] font-medium text-zinc-900 shadow-sm transition-colors hover:bg-white backdrop-blur-sm sm:w-auto"
                >
                  See Demo <ArrowRight size={16} className="text-zinc-500" />
                </Link>
              </div>
            </div>
          </div>
        </AdvancedScrollReveal>
      </section>

      <SiteFooter />
    </main>
  )
}
