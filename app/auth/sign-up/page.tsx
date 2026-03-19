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
      let target = data?.next || next || "/app/dashboard"
      if (target === "/app/dashboard" || target.startsWith("/app/dashboard/")) {
        let resolvedSlug = ""
        try {
          const ctxRes = await fetch("/api/auth/context", { cache: "no-store" })
          const ctx = await ctxRes.json().catch(() => ({} as any))
          if (ctx?.orgSlug) {
            resolvedSlug = String(ctx.orgSlug).trim()
          }
        } catch {
          // ignore and fallback
        }
        if (resolvedSlug) {
          target = target.replace(/^\/app\/dashboard/, `/app/${resolvedSlug}/dashboard`)
        }
      }
      router.replace(target)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Could not create account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#0a1020] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_0%_0%,rgba(20,184,166,0.24),transparent),radial-gradient(900px_600px_at_100%_100%,rgba(99,102,241,0.24),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,16,32,0.97),rgba(17,24,39,0.95))]" />

      <Link href="/" className="absolute left-5 top-5 z-20 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur">
        <Logo size={24} className="text-teal-300" />
        <div>
          <h1 className="text-xl font-black italic leading-none">KhataPlus</h1>
          <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-300">Create Account</p>
        </div>
      </Link>

      <div className="relative z-10 min-h-svh grid lg:grid-cols-[540px_1fr]">
        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-teal-300 font-black">Onboarding</p>
              <h3 className="text-3xl font-black tracking-tight mt-1">Create your workspace</h3>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 font-bold">Full Name</label>
                <div className="relative">
                  <UserRound className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9 h-11 bg-black/25 border-white/20 text-white placeholder:text-zinc-400" placeholder="Your name" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 font-bold">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11 bg-black/25 border-white/20 text-white placeholder:text-zinc-400" placeholder="you@shop.com" disabled={phase === "verify"} required />
                </div>
              </div>

              {phase === "verify" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 font-bold">Verification Code</label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\s+/g, "").replace(/^#/, ""))} className="h-11 bg-black/25 border-white/20 text-white placeholder:text-zinc-400 tracking-[0.22em] font-black" placeholder="Enter 6-digit code" required />
                  <p className="text-[11px] text-zinc-300">Code sent to <span className="font-black">{maskedEmail || email}</span></p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 text-xs uppercase tracking-widest font-black bg-teal-500 hover:bg-teal-400 text-zinc-950">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{phase === "verify" ? "Verify & Continue" : "Send Verification Code"} <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">{phase === "verify" ? "Need to fix email?" : "Already have an account?"}</span>
              {phase === "verify" ? (
                <button type="button" className="text-teal-300 font-black uppercase tracking-widest hover:text-teal-200" onClick={() => { setPhase("email"); setCode(""); setError(""); setVerifyLoginId("") }}>
                  Change Email
                </button>
              ) : (
                <Link href={loginHref} className="text-teal-300 font-black uppercase tracking-widest hover:text-teal-200">Sign In</Link>
              )}
            </div>
          </div>
        </section>

        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300 mb-6">Setup Journey</p>
          <h2 className="text-6xl font-black leading-[0.88] tracking-[-0.03em]">
            Start Fast.
            <span className="block text-teal-300">Scale Smoothly.</span>
          </h2>
          <p className="mt-6 text-zinc-300 max-w-md font-medium">
            Get verified in seconds and launch your organization with clean defaults for team, billing, and reports.
          </p>
          <div className="mt-10 space-y-4 max-w-lg">
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-300 font-black">Step 1</p>
              <p className="text-lg font-black mt-1">Verify identity by OTP</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-300 font-black">Step 2</p>
              <p className="text-lg font-black mt-1">Create organization basics</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-300 font-black">Step 3</p>
              <p className="text-lg font-black mt-1">Land on dashboard with slug routing</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

