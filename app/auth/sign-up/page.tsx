"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/ui/logo"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const target = targetRaw || "/setup-organization"
  if (typeof window !== "undefined" && isAppTargetPath(target)) {
    const { protocol, hostname, port } = window.location
    const appHost = getAppHostFromCurrentHost(hostname)
    const portPart = port ? `:${port}` : ""
    window.location.assign(`${protocol}//${appHost}${portPart}${target}`)
    return
  }
  window.location.assign(target)
}

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invite = searchParams.get("invite")
  const next = searchParams.get("next") || "/setup-organization"

  useEffect(() => {
    if (!invite) return
    router.replace(`/auth/invite-sign-up?invite=${encodeURIComponent(invite)}`)
  }, [invite, router])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otp, setOtp] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!name || !email) {
      toast.error("Please enter name and email")
      return
    }
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, code: "", next }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Registration failed")

      setIsSuccess(true)
      toast.success("Verification code sent!")
    } catch (err: any) {
      toast.error(err?.message || "Could not create account.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit code")
      return
    }
    setVerifyingOtp(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, code: otp, next }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Invalid or expired code")

      toast.success("Account verified!")
      redirectAfterAuth(data?.next || next || "/setup-organization")
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired code")
      setVerifyingOtp(false)
    }
  }

  const benefits = [
    "GST-compliant invoicing",
    "Real-time inventory tracking",
    "Works offline on any device",
    "Khata (credit) management",
  ]

  return (
    invite ? (
      <div className="min-h-svh w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirecting to invite sign-up...
        </div>
      </div>
    ) : (
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
              <h1 className="text-6xl xl:text-7xl font-black leading-[0.9] tracking-tighter mb-6">
                Manage
                <br />
                <span className="text-emerald-400">Smarter.</span>
              </h1>
              <p className="text-xl text-white/70 max-w-sm font-medium leading-relaxed">
                Experience the next generation of business management with India's most powerful OS.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-up duration-700 delay-[400ms]">
              {benefits.map((benefit, idx) => (
                <div
                  key={benefit}
                  className="flex items-center gap-4 group cursor-default animate-in fade-in slide-left duration-500"
                  style={{ animationDelay: `${500 + idx * 100}ms` }}
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-emerald-500/40 group-hover:scale-110 transition-all duration-300 shadow-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors drop-shadow-md">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-12 border-t border-white/10">
            <p className="text-sm text-white/40 font-medium">Copyright 2026 KhataPlus Online. All rights reserved.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-purple-600/10 dark:bg-purple-600/10 blur-[130px] rounded-full animate-orbit" />
          <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-emerald-600/10 dark:bg-emerald-600/10 blur-[130px] rounded-full animate-orbit-slow" />
        </div>

        <div className="absolute top-6 left-6 lg:hidden z-20">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} className="text-purple-600" />
            <span className="font-bold text-xl text-zinc-900 dark:text-white">KhataPlus</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-up duration-700">
          {!isSuccess ? (
            <div key="signup-form" className="space-y-8 animate-in fade-in slide-right duration-500">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Digital <span className="text-purple-600">India Era.</span>
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium font-outfit">Empowering India's next generation of entrepreneurs.</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold placeholder:text-zinc-400"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold placeholder:text-zinc-400"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !name || !email}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group tracking-tight",
                    loading || !name || !email
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border-2 border-zinc-200 dark:border-zinc-800"
                      : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 translate-y-[-2px] hover:translate-y-[-4px]"
                  )}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Send Verification Code <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

            </div>
          ) : (
            <div key="success-message" className="text-center space-y-6 py-8 animate-in fade-in scale-in duration-500">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white italic tracking-tighter">Verify Code</h3>
                <div className="space-y-4">
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    We've sent a 6-digit verification code to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>. Please enter it below to activate your account.
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-6 pt-2">
                    <div className="relative group">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full text-center text-3xl tracking-[1.2em] font-black py-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otp.length < 6}
                      className={cn(
                        "w-full py-5 rounded-2xl font-black italic text-lg transition-all flex items-center justify-center gap-2",
                        verifyingOtp || otp.length < 6
                          ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-600/20"
                      )}
                    >
                      {verifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Verification"}
                    </button>
                  </form>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => handleSignUp()}
                    disabled={loading}
                    className="w-full py-4 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Code"}
                  </button>

                  <button onClick={() => setIsSuccess(false)} className="text-sm font-bold text-purple-600 hover:text-purple-700">
                    Entered wrong details? Go back
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 group">
                Sign in
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>

          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href="/demo" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium">
              Or try the demo without signing up -&gt;
            </Link>
          </div>
        </div>
      </div>
    </div>
    )
  )
}
