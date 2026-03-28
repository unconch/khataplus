"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Loader2, Mail, UserRound } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = useMemo(() => {
    const raw = searchParams.get("next")
    if (!raw) return "/onboarding"
    if (!raw.startsWith("/") || raw.startsWith("/auth/")) return "/onboarding"
    return raw
  }, [searchParams])

  const loginHref = `/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<"email" | "verify">("email")
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
          email: phase === "verify" ? verifyLoginId || email : email,
          code: phase === "verify" ? code : "",
          next,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Registration failed")
      if (data?.phase === "verify") {
        setPhase("verify")
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
    <div className="min-h-svh bg-[#f2f3f5] text-zinc-900 p-3 sm:p-4">
      <div className="min-h-[calc(100svh-24px)] sm:min-h-[calc(100svh-32px)] overflow-hidden rounded-2xl border border-zinc-200 bg-[#f2f3f5] grid lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between bg-[#05070b] text-white px-14 py-14">
          <div className="inline-flex items-center gap-3">
            <Logo size={28} className="text-white" />
            <span className="text-4xl font-black italic">KhataPlus</span>
          </div>
          <div>
            <h2 className="text-6xl leading-[1.02] font-semibold tracking-tight">Create your workspace.</h2>
            <p className="mt-5 text-3xl text-zinc-300">Verify once, land in your dashboard.</p>
          </div>
          <p className="text-sm text-zinc-500">Accounts, teams, billing — set up in minutes.</p>
        </section>

        <section className="relative flex items-center justify-center p-6 sm:p-8 lg:p-10 min-h-svh lg:min-h-0 bg-[radial-gradient(90%_80%_at_20%_15%,#5b50d7_0%,transparent_58%),radial-gradient(90%_85%_at_80%_85%,#5b50d7_0%,transparent_60%),linear-gradient(180deg,#f2efea,#f6eee8)]">
          <Link
            href="/"
            className="absolute left-5 top-5 z-20 inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm lg:hidden"
          >
            <Logo size={24} className="text-emerald-500" />
            <div>
              <h1 className="text-xl font-black italic leading-none">KhataPlus</h1>
              <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Create Account</p>
            </div>
          </Link>

          <div className="w-full max-w-md rounded-3xl border border-zinc-300 bg-white/90 shadow-[0_20px_60px_rgba(16,24,40,0.20)] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-indigo-600 font-black">Create Account</p>
              <h3 className="text-center text-5xl font-semibold tracking-tight mt-3">Sign up</h3>
              <p className="text-center text-zinc-500 mt-2">Verify your email to continue</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Full Name</label>
                <div className="relative">
                  <UserRound className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 rounded-xl disabled:!bg-white disabled:!opacity-100 disabled:!text-zinc-900"
                    style={phase === "verify" ? { backgroundColor: "#fff", opacity: 1, color: "#18181b" } : undefined}
                    placeholder="Your name"
                    disabled={phase === "verify"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 rounded-xl disabled:!bg-white disabled:!opacity-100 disabled:!text-zinc-900"
                    style={phase === "verify" ? { backgroundColor: "#fff", opacity: 1, color: "#18181b" } : undefined}
                    placeholder="you@shop.com"
                    disabled={phase === "verify"}
                    required
                  />
                </div>
              </div>

              {phase === "verify" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Verification Code</label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\s+/g, "").replace(/^#/, ""))}
                    className="h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 tracking-[0.22em] font-black rounded-xl disabled:!bg-white disabled:!opacity-100 disabled:!text-zinc-900"
                    style={{ backgroundColor: "#fff", opacity: 1, color: "#18181b" }}
                    placeholder="Enter 6-digit code"
                    required
                  />
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
                className="w-full h-12 rounded-lg text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {phase === "verify" ? "Verify & Create Account" : "Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">{phase === "verify" ? "Wrong email?" : "Already have an account?"}</span>
              {phase === "verify" ? (
                <button
                  type="button"
                  className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700"
                  onClick={() => {
                    setPhase("email")
                    setCode("")
                    setError("")
                    setVerifyLoginId("")
                  }}
                >
                  Change Email
                </button>
              ) : (
                <Link href={loginHref} className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
