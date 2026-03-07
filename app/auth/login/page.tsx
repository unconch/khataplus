"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/ui/logo"
import { ArrowRight, ShieldCheck, Zap, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function getAppHostFromCurrentHost(hostname: string): string {
  if (!hostname) return "app.khataplus.online"
  if (hostname === "localhost" || hostname === "127.0.0.1") return "app.localhost"
  if (hostname.endsWith(".localhost")) return "app.localhost"

  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)
  return `app.${base}`
}

function isAppTargetPath(path: string): boolean {
  return (
    path === "/setup-organization" ||
    path.startsWith("/setup-organization/") ||
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    /^\/[^/]+\/dashboard(?:\/|$)/.test(path)
  )
}

function redirectAfterAuth(targetRaw: string) {
  const target = targetRaw || "/dashboard"
  if (typeof window !== "undefined" && isAppTargetPath(target)) {
    const { protocol, hostname, port } = window.location
    const appHost = getAppHostFromCurrentHost(hostname)
    const portPart = port ? `:${port}` : ""
    window.location.assign(`${protocol}//${appHost}${portPart}${target}`)
    return
  }
  window.location.assign(target)
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [phase, setPhase] = useState<"email" | "verify">("email")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: phase === "verify" ? code : "",
          next,
        }),
      })

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Login failed")

      if (data?.phase === "verify") {
        setPhase("verify")
        setMaskedEmail(data?.maskedEmail || email)
        setResendCooldown(30)
        toast.success("Verification code sent.")
        return
      }

      toast.success("Welcome back!")
      redirectAfterAuth(data?.next || next || "/dashboard")
    } catch (err: any) {
      toast.error(err?.message || "Could not sign in.")
    } finally {
      setLoading(false)
    }
  }

  const onResendCode = async () => {
    if (!email || resendCooldown > 0 || resendLoading) return
    setResendLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: "", next }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Could not resend code")

      setMaskedEmail(data?.maskedEmail || email)
      setResendCooldown(30)
      toast.success("A new code was sent.")
    } catch (err: any) {
      toast.error(err?.message || "Could not resend code.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-svh w-full flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-0" />
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-violet-600/20 rounded-full blur-[120px] animate-orbit" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[120px] animate-orbit-slow" />
        </div>

        <div className="relative z-10 flex flex-col w-full p-16 text-white">
          <div className="mb-auto animate-in fade-in slide-left duration-500">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                <Logo size={32} className="text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter">KhataPlus</span>
            </Link>
          </div>

          <div className="space-y-12">
            <div className="animate-in fade-in slide-up duration-700 delay-200">
              <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur-md rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] mb-8 border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Enterprise Grade Security
              </div>
              <h1 className="text-6xl xl:text-7xl font-black leading-[0.9] tracking-tighter mb-6">
                Welcome
                <br />
                <span className="text-emerald-400">Back.</span>
              </h1>
              <p className="text-xl text-white/70 max-w-sm font-medium leading-relaxed">
                Your business ecosystem is ready. Log in to continue your business growth.
              </p>
            </div>

            <div className="flex gap-4 animate-in fade-in slide-up duration-700 delay-[400ms]">
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

      <div className="flex-1 flex items-center justify-center p-6 pt-20 lg:pt-6 bg-zinc-50 dark:bg-zinc-950 relative">
        <div className="absolute top-6 left-6 lg:hidden z-50">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} className="text-emerald-600" />
            <span className="font-bold text-lg text-zinc-900 dark:text-white">KhataPlus</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-up duration-700">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
              Welcome <span className="text-emerald-600">Back.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium font-outfit">
              Securely access your business ecosystem in the Digital India Era.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">Verification Code</label>
              <div className="relative">
                <input
                  type={showCode ? "text" : "password"}
                  required={phase === "verify"}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm pr-11"
                  placeholder="000000"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {phase === "verify" && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Code sent to <span className="font-semibold">{maskedEmail || email}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : phase === "verify" ? "Verify & Sign In" : "Send Login Code"}
            </button>
          </form>

          {phase === "verify" && (
            <div className="w-full relative py-2 flex justify-center">
              <button
                type="button"
                onClick={onResendCode}
                disabled={resendLoading || resendCooldown > 0}
                className="text-sm text-zinc-600 dark:text-zinc-300 font-semibold disabled:opacity-50"
              >
                {resendLoading ? "Resending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 group">
                Create one
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>

          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href="/demo" className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium">
              Or try the demo without signing up -&gt;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
