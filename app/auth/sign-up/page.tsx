"use client"

import { useState } from "react"
import { Logo } from "@/components/ui/logo"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type Step = "name" | "email" | "otp"

export default function SignUpPage() {
  const [step, setStep] = useState<Step>("name")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function getAppHostFromCurrentHost(hostname: string): string {
    if (!hostname) return "app.khataplus.online"
    if (hostname === "localhost" || hostname === "127.0.0.1") return hostname
    if (hostname.endsWith(".localhost")) return hostname
    let base = hostname.toLowerCase()
    if (base.startsWith("www.")) base = base.slice(4)
    if (base.startsWith("demo.")) base = base.slice(5)
    if (base.startsWith("pos.")) base = base.slice(4)
    if (base.startsWith("app.")) base = base.slice(4)
    return `app.${base}`
  }

  function redirectToAppPath(target: string) {
    if (typeof window === "undefined") return
    const { protocol, hostname, port } = window.location
    const appHost = getAppHostFromCurrentHost(hostname)
    const portPart = port ? `:${port}` : ""
    const needsAppHost = hostname !== appHost
    const url = needsAppHost ? `${protocol}//${appHost}${portPart}${target}` : target
    window.location.assign(url)
  }

  const getEmailRedirectTo = () => {
    if (typeof window === "undefined") return undefined
    const base = window.location.origin
    return `${base}/auth/callback?source=signup`
  }

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

  const benefits = [
    "GST-compliant invoicing",
    "Real-time inventory tracking",
    "Works offline on any device",
    "Khata (credit) management",
  ]

  // STEP 1 — Name
  function handleName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Please enter your name")
    setStep("email")
  }

  // STEP 2 — Email → send OTP
  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return toast.error("Please enter your email")
    setLoading(true)
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: { full_name: name },
            emailRedirectTo: getEmailRedirectTo(),
          },
        })
      )
      if (error) throw new Error(error.message || "Failed to send code")
      toast.success("Verification code sent!")
      setStep("otp")
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // STEP 3 — Verify OTP
  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) return toast.error("Enter the 6-digit code")
    setLoading(true)
    try {
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({
          email,
          token: otp,
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

      try {
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, full_name: name, email: data.user.email || email })
      } catch { }
      toast.success("Account created!")
      await waitForSession()
      window.location.assign("/auth/callback?source=signup")
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired code")
    } finally {
      setLoading(false)
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
              <h1 className="text-6xl xl:text-7xl font-black leading-[0.9] tracking-tighter mb-6">
                Manage<br />
                <span className="text-emerald-400">Smarter.</span>
              </h1>
              <p className="text-xl text-white/70 max-w-sm font-medium leading-relaxed">
                India's most powerful business OS.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-emerald-500/40 group-hover:scale-110 transition-all duration-300 shadow-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-12 border-t border-white/10">
            <p className="text-sm text-white/40 font-medium">Copyright 2026 KhataPlus Online. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-purple-600/10 blur-[130px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-emerald-600/10 blur-[130px] rounded-full" />
        </div>

        <div className="absolute top-6 left-6 lg:hidden z-20">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} className="text-purple-600" />
            <span className="font-bold text-xl text-zinc-900 dark:text-white">KhataPlus</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            {(["name", "email", "otp"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-8 rounded-full transition-all duration-300",
                  step === s ? "bg-purple-600 w-12" :
                    (["name", "email", "otp"].indexOf(step) > i) ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                )} />
              </div>
            ))}
          </div>

          {/* STEP 1 — Name */}
          {step === "name" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Hey there! <span className="text-purple-600">👋</span>
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                  What should we call you?
                </p>
              </div>
              <form onSubmit={handleName} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Full Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 rounded-2xl font-black text-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 group"
                >
                  Continue <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 — Email */}
          {step === "email" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Hi, <span className="text-purple-600">{name.split(" ")[0]}!</span>
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                  What's your email address?
                </p>
              </div>
              <form onSubmit={handleEmail} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold placeholder:text-zinc-400 text-zinc-900 dark:text-white"
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
                      : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 hover:translate-y-[-2px]"
                  )}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Send Code <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
                <button type="button" onClick={() => setStep("name")} className="w-full py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                  ← Change name
                </button>
              </form>
            </div>
          )}

          {/* STEP 3 — OTP */}
          {step === "otp" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Check your <span className="text-emerald-500">inbox</span>
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                  We sent a 6-digit code to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>
                </p>
              </div>
              <form onSubmit={handleOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-3xl tracking-[1.2em] font-black py-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800 text-zinc-900 dark:text-white"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2",
                    loading || otp.length < 6
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-600/20"
                  )}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Create Account"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleEmail({ preventDefault: () => { } } as any)}
                  className="w-full py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  {loading ? "Resending..." : "Resend code"}
                </button>
                <button type="button" onClick={() => setStep("email")} className="w-full py-3 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
                  ← Change email
                </button>
              </form>
            </div>
          )}

          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 group">
                Sign in <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
