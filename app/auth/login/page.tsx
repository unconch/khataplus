"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { ArrowRight, ShieldCheck, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type Step = "email" | "verify"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || ""
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const withTimeout = async <T,>(promise: Promise<T>, ms = 8000) => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ])
  }

  const waitForSession = async (attempts = 6, delayMs = 200) => {
    for (let i = 0; i < attempts; i += 1) {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) return data.session
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    return null
  }

  const maskEmail = (value: string) => {
    const [local, domain] = value.split("@")
    if (!local || !domain) return value
    if (local.length <= 2) return `${local[0] || "*"}*@${domain}`
    return `${local.slice(0, 2)}***@${domain}`
  }

  const safeNext = useMemo(() => {
    if (!next || !next.startsWith("/") || next.startsWith("/auth/")) return ""
    return next
  }, [next])

  const getEmailRedirectTo = () => {
    if (typeof window === "undefined") return undefined
    const base = window.location.origin
    const nextParam = safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""
    return `${base}/auth/callback?source=login${nextParam}`
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return toast.error("Please enter your email")
    setLoading(true)
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: getEmailRedirectTo(),
          },
        })
      )
      if (error) throw new Error(error.message || "Failed to send code")
      setMaskedEmail(maskEmail(email))
      setCooldown(30)
      setStep("verify")
      toast.success("Verification code sent!")
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < 6) return toast.error("Enter the 6-digit code")
    setLoading(true)
    try {
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        })
      )
      if (error || !data.user?.id) throw new Error(error?.message || "Invalid code")
      if (data.session?.access_token && data.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      }
      toast.success("Welcome back!")
      const nextParam = safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""
      await waitForSession()
      router.replace(`/auth/callback?source=login${nextParam}`)
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired code")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendLoading || cooldown > 0) return
    setResendLoading(true)
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: getEmailRedirectTo(),
          },
        })
      )
      if (error) throw new Error(error.message)
      setMaskedEmail(maskEmail(email))
      setCooldown(30)
      toast.success("New code sent!")
    } catch (err: any) {
      toast.error(err?.message || "Could not resend code")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-svh w-full flex">

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-0" />
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col w-full p-16 text-white">
          <div className="mb-auto">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                <Logo size={32} className="text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter">KhataPlus</span>
            </Link>
          </div>
          <div className="space-y-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur-md rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] mb-8 border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Enterprise Grade Security
              </div>
              <h1 className="text-6xl xl:text-7xl font-black leading-[0.9] tracking-tighter mb-6">
                Welcome<br />
                <span className="text-emerald-400">Back.</span>
              </h1>
              <p className="text-xl text-white/70 max-w-sm font-medium leading-relaxed">
                Your business ecosystem is ready. Log in to continue your growth.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 text-sm font-bold border border-white/10">
                <Zap className="h-4 w-4 text-emerald-300" />
                Zero Latency
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 text-sm font-bold border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Protected
              </div>
            </div>
          </div>
          <div className="mt-auto pt-12 border-t border-white/10">
            <p className="text-sm text-white/40 font-medium">Copyright 2026 KhataPlus Online. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 pt-20 lg:pt-6 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-emerald-600/10 blur-[130px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-violet-600/10 blur-[130px] rounded-full" />
        </div>

        <div className="absolute top-6 left-6 lg:hidden z-20">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} className="text-emerald-600" />
            <span className="font-bold text-lg text-zinc-900 dark:text-white">KhataPlus</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">

          {/* Step pills */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            {(["email", "verify"] as Step[]).map((s, i) => (
              <div key={s} className={cn(
                "h-2 rounded-full transition-all duration-300",
                step === s ? "bg-emerald-600 w-12" :
                  i < ["email", "verify"].indexOf(step) ? "bg-emerald-500 w-8" : "bg-zinc-200 dark:bg-zinc-800 w-8"
              )} />
            ))}
          </div>

          {/* STEP 1 — Email */}
          {step === "email" && (
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Welcome <span className="text-emerald-600">Back.</span>
                </h2>
                <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                  Enter your email to receive a login code.
                </p>
              </div>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 group",
                    loading
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border-2 border-zinc-200 dark:border-zinc-800"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 hover:translate-y-[-2px]"
                  )}
                >
                  {loading
                    ? <Loader2 className="h-6 w-6 animate-spin" />
                    : <>Send Login Code <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>
                  }
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 — OTP */}
          {step === "verify" && (
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Check your <span className="text-emerald-500">inbox</span>
                </h2>
                <p className="mt-3 text-zinc-500 dark:text-zinc-400">
                  Code sent to <span className="font-bold text-zinc-900 dark:text-white">{maskedEmail || email}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-3xl tracking-[1.2em] font-black py-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800 text-zinc-900 dark:text-white"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2",
                    loading || code.length < 6
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-600/20"
                  )}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || cooldown > 0}
                  className="w-full py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? "Resending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode("") }}
                  className="w-full py-3 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  ← Change email
                </button>
              </form>
            </div>
          )}

          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 group">
                Create one <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>

          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href="/demo" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium">
              Or try the demo without signing up →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
