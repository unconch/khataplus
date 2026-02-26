"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Loader2, Mail, Sparkles, UserRound } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = useMemo(() => {
    const raw = searchParams.get("next")
    if (!raw) return "/setup-organization"
    if (!raw.startsWith("/") || raw.startsWith("/auth/")) return "/setup-organization"
    return raw
  }, [searchParams])

  const loginHref = `/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<"email" | "verify">("email")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [verifyLoginId, setVerifyLoginId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: phase === "verify" ? (verifyLoginId || email) : email,
          code: phase === "verify" ? code : "",
          next,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Registration failed")
      if (data?.phase === "verify") {
        setPhase("verify")
        setMaskedEmail(data?.maskedEmail || email)
        setVerifyLoginId(email.trim().toLowerCase())
        return
      }
      router.replace(data?.next || next || "/setup-organization")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Could not create account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh w-full bg-[#0b1010] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.3),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.28),transparent_36%)]" />
      <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px]" />
      <Link href="/" className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20 inline-flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl">
          <Logo size={28} className="text-teal-300" />
        </div>
        <div>
          <h1 className="text-[1.85rem] font-black italic tracking-tight leading-none">KhataPlus</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-300">Business OS</p>
        </div>
      </Link>

      <div className="relative z-10 min-h-svh flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <div className="w-full max-w-[90rem] max-h-[calc(100svh-1.5rem)] grid items-center gap-4 lg:grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_minmax(420px,560px)_minmax(260px,1fr)]">
          <aside className="hidden xl:flex flex-col gap-8 px-4 py-2 justify-center">
            <div />

            <div className="space-y-5">
              <h2 className="text-[clamp(2.6rem,3.8vw,4.2rem)] font-black leading-[0.92] tracking-[-0.04em]">
                Create account.
                <span className="block text-teal-300">Launch cleanly.</span>
              </h2>
              <p className="text-zinc-300 text-sm font-semibold max-w-xs">
                Setup starts in minutes with OTP auth and guided business onboarding.
              </p>
            </div>

            <div className="grid gap-3 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal-300" /> Fast onboarding flow</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal-300" /> Guided setup after signup</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal-300" /> Ready for GST and ledger</div>
            </div>
          </aside>

          <section className="relative flex items-center justify-center py-1">
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(20,184,166,0.26)_0%,rgba(20,184,166,0.06)_45%,transparent_72%)] blur-2xl" />
            <div className="relative w-full max-w-[min(560px,92vw)] rounded-[2rem] border border-white/30 bg-white/[0.14] backdrop-blur-3xl p-6 md:p-8 ring-1 ring-white/20 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30">
                <Logo size={28} className="text-teal-300" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Create Account</h1>
                <p className="text-xs text-zinc-300">Set up your KhataPlus identity</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300 font-bold">Full Name</label>
                <div className="relative">
                  <UserRound className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-11 bg-black/30 border-white/20 text-white placeholder:text-zinc-400"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-300 font-bold">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 bg-black/30 border-white/20 text-white placeholder:text-zinc-400"
                    placeholder="you@shop.com"
                    disabled={phase === "verify"}
                    required
                  />
                </div>
              </div>

              {phase === "verify" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-zinc-300 font-bold">Verification Code</label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\s+/g, "").replace(/^#/, ""))}
                    className="h-11 bg-black/30 border-white/20 text-white placeholder:text-zinc-400 tracking-[0.2em] font-black"
                    placeholder="Enter 6-digit code"
                    required
                  />
                  <p className="text-[11px] text-zinc-300">
                    Code sent to <span className="font-black">{maskedEmail || email}</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-xs uppercase tracking-widest font-black bg-teal-500 hover:bg-teal-400 text-zinc-950"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{phase === "verify" ? "Verify & Continue" : "Send Verification Code"} <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">{phase === "verify" ? "Need to fix email?" : "Already have an account?"}</span>
              {phase === "verify" ? (
                <button
                  type="button"
                  className="text-teal-300 font-black uppercase tracking-widest hover:text-teal-200"
                  onClick={() => { setPhase("email"); setCode(""); setError(""); setVerifyLoginId("") }}
                >
                  Change Email
                </button>
              ) : (
                <Link href={loginHref} className="text-teal-300 font-black uppercase tracking-widest hover:text-teal-200">
                  Sign In
                </Link>
              )}
            </div>
            </div>
          </section>

          <aside className="hidden xl:flex flex-col gap-6 px-4 py-2 justify-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-black text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.8)]" />
                Setup Track
              </div>
              <h3 className="text-[clamp(2rem,2.6vw,2.6rem)] font-black tracking-tight leading-[0.95]">What Happens Next</h3>
              <p className="text-sm text-zinc-300 font-semibold max-w-sm">Clear 3-step onboarding before you land in your billing workspace.</p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="px-2 py-1 rounded-full bg-teal-400/15 text-teal-200 border border-teal-300/30">OTP VERIFY</span>
              <span className="px-2 py-1 rounded-full bg-indigo-400/15 text-indigo-200 border border-indigo-300/30">ORG SETUP</span>
              <span className="px-2 py-1 rounded-full bg-zinc-500/20 text-zinc-200 border border-white/15">READY TO BILL</span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full border border-teal-300/45 text-teal-200 text-[11px] font-black flex items-center justify-center mt-0.5">1</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Step 1</p>
                  <p className="text-xl font-black mt-1 leading-none">Verify email with OTP</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full border border-teal-300/45 text-teal-200 text-[11px] font-black flex items-center justify-center mt-0.5">2</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Step 2</p>
                  <p className="text-lg font-black mt-1 leading-tight">Set up organization basics</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full border border-teal-300/45 text-teal-200 text-[11px] font-black flex items-center justify-center mt-0.5">3</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Step 3</p>
                  <p className="text-lg font-black mt-1 leading-tight">Enter dashboard and start billing</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-300 font-semibold leading-relaxed pt-4 border-t border-white/10">
              Use your real business identity to keep invoices, team access, and settings consistent.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
