"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { startAuthentication } from "@simplewebauthn/browser"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Loader2, Mail, KeyRound } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = useMemo(() => {
    const raw = searchParams.get("next")
    if (!raw) return "/app/dashboard"
    if (!raw.startsWith("/") || raw.startsWith("/auth/")) return "/app/dashboard"
    return raw
  }, [searchParams])

  const signUpHref = `/auth/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`
  const resendCooldownSeconds = 30
  const pendingLoginStorageKey = "kp_login_pending"
  const pendingLoginMaxAgeMs = 1000 * 60 * 15

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<"email" | "verify">("email")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [verifyLoginId, setVerifyLoginId] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [otpSendPending, setOtpSendPending] = useState(false)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const maskForUi = (raw: string) => {
    const value = String(raw || "").trim().toLowerCase()
    const [local, domain] = value.split("@")
    if (!local || !domain) return value
    if (local.length <= 2) return `${local[0] || "*"}*@${domain}`
    return `${local.slice(0, 2)}***@${domain}`
  }

  async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  const clearPendingLogin = () => {
    if (typeof window === "undefined") return
    window.sessionStorage.removeItem(pendingLoginStorageKey)
  }

  const savePendingLogin = (loginId: string, masked: string) => {
    if (typeof window === "undefined" || !loginId) return
    window.sessionStorage.setItem(
      pendingLoginStorageKey,
      JSON.stringify({
        email: loginId,
        maskedEmail: masked || loginId,
        createdAt: Date.now(),
      })
    )
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.sessionStorage.getItem(pendingLoginStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { email?: string; maskedEmail?: string; createdAt?: number }
      const loginId = String(parsed?.email || "").trim().toLowerCase()
      const masked = String(parsed?.maskedEmail || loginId).trim()
      const createdAt = Number(parsed?.createdAt || 0)
      if (!loginId || !createdAt || Date.now() - createdAt > pendingLoginMaxAgeMs) {
        clearPendingLogin()
        return
      }
      setEmail(loginId)
      setVerifyLoginId(loginId)
      setMaskedEmail(masked || loginId)
      setPhase("verify")
    } catch {
      clearPendingLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    // Warm up the auth route to reduce first-submit cold start delay.
    fetch("/api/auth/login", { method: "GET", cache: "no-store" }).catch(() => undefined)
  }, [])

  const openPasskeyFlow = async () => {
    const loginId = email.trim().toLowerCase()
    if (!loginId) {
      setError("Enter your email first, then use passkey.")
      return
    }

    setError("")
    setInfo("")
    setPasskeyLoading(true)
    try {
      const startRes = await fetch("/api/auth/passkey/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginId }),
      })
      const startData = await startRes.json().catch(() => ({} as any))
      if (!startRes.ok) {
        throw new Error(startData?.error || "Could not start passkey login")
      }

      const authOptionsRaw =
        startData?.options ??
        startData?.publicKey ??
        startData?.data?.options ??
        startData?.data?.publicKey ??
        null
      const transactionId =
        String(
          startData?.transactionId ??
            startData?.transactionID ??
            startData?.data?.transactionId ??
            startData?.data?.transactionID ??
            ""
        ).trim()
      if (!authOptionsRaw || !transactionId) {
        throw new Error("Passkey login response is invalid")
      }
      const authOptions =
        (typeof authOptionsRaw === "string" ? JSON.parse(authOptionsRaw) : authOptionsRaw?.publicKey || authOptionsRaw) as any

      const passkeyResponse = await startAuthentication({ optionsJSON: authOptions })

      const finishRes = await fetch("/api/auth/passkey/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginId,
          transactionId,
          response: passkeyResponse,
          next,
        }),
      })
      const finishData = await finishRes.json().catch(() => ({} as any))
      if (!finishRes.ok) {
        throw new Error(finishData?.error || "Passkey verification failed")
      }
      let target = finishData?.next || next || "/app/dashboard"
      if (target === "/app/dashboard" || target.startsWith("/app/dashboard/")) {
        const slugFromResponse = typeof finishData?.orgSlug === "string" ? finishData.orgSlug.trim() : ""
        let resolvedSlug = slugFromResponse
        if (!resolvedSlug) {
          try {
            const ctxRes = await fetch("/api/auth/context", { cache: "no-store" })
            const ctx = await ctxRes.json().catch(() => ({} as any))
            if (ctx?.orgSlug) {
              resolvedSlug = String(ctx.orgSlug).trim()
            }
          } catch {
            // ignore and fallback to /app/dashboard
          }
        }
        if (resolvedSlug) {
          target = target.replace(/^\/app\/dashboard/, `/app/${resolvedSlug}/dashboard`)
        }
      }
      router.replace(target)
      router.refresh()
    } catch (err: any) {
      const fallbackEmail = loginId
      try {
        const otpRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fallbackEmail, code: "", next }),
        })
        const otpData = await otpRes.json().catch(() => ({} as any))
        if (otpRes.ok && otpData?.phase === "verify") {
          setPhase("verify")
          setMaskedEmail(otpData?.maskedEmail || fallbackEmail)
          setVerifyLoginId(fallbackEmail)
          setResendCooldown(resendCooldownSeconds)
          setInfo("No passkey found or passkey is unavailable. We sent you a login code instead.")
          return
        }
      } catch {
        // keep passkey error
      }

      if (err?.name === "NotAllowedError") {
        setError("Passkey login was cancelled.")
      } else {
        setError(err?.message || "Passkey login failed.")
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setInfo("")
    const requestingOtp = phase === "email"
    const loginId = email.trim().toLowerCase()
    if (requestingOtp && loginId) {
      setPhase("verify")
      setVerifyLoginId(loginId)
      setMaskedEmail(maskForUi(loginId))
      setResendCooldown(resendCooldownSeconds)
      setInfo("Sending verification code...")
      setOtpSendPending(true)
      try {
        let sent = false
        let lastError = "Could not send verification code."

        if (supabaseUrl && supabaseAnonKey) {
          try {
            const directOtp = await fetchWithTimeout(
              `${supabaseUrl}/auth/v1/otp`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: supabaseAnonKey,
                },
                body: JSON.stringify({ email: loginId, create_user: false }),
              },
              6000
            )
            const payload = await directOtp.json().catch(() => ({} as any))
            if (directOtp.ok) {
              sent = true
            } else {
              lastError = payload?.error_description || payload?.msg || payload?.error || lastError
            }
          } catch (err: any) {
            lastError = err?.name === "AbortError" ? "OTP request timed out. Retrying..." : err?.message || lastError
          }
        }

        if (!sent) {
          const res = await fetchWithTimeout(
            "/api/auth/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: loginId, code: "", next }),
            },
            8000
          )
          const data = await res.json().catch(() => ({} as any))
          if (!res.ok) {
            throw new Error(data?.error || lastError)
          }
          sent = true
        }

        if (sent) {
          setMaskedEmail(maskForUi(loginId))
          savePendingLogin(loginId, maskForUi(loginId))
          setInfo("Code sent. Check your email.")
        }
      } catch (err: any) {
        setPhase("email")
        setCode("")
        setResendCooldown(0)
        setError(err?.name === "AbortError" ? "OTP request timed out. Please tap continue again." : err?.message || "Could not sign in.")
      } finally {
        setOtpSendPending(false)
      }
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: phase === "verify" ? verifyLoginId || email : email,
          code: phase === "verify" ? code : "",
          next,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Login failed")
      if (data?.phase === "verify") {
        setPhase("verify")
        setMaskedEmail(data?.maskedEmail || email)
        setVerifyLoginId(loginId)
        savePendingLogin(loginId, data?.maskedEmail || loginId)
        if (requestingOtp) setResendCooldown(resendCooldownSeconds)
        setInfo("Code sent. Check your email.")
        return
      }
      let target = data?.next || next || "/app/dashboard"
      if (target === "/app/dashboard" || target.startsWith("/app/dashboard/")) {
        const slugFromResponse = typeof data?.orgSlug === "string" ? data.orgSlug.trim() : ""
        let resolvedSlug = slugFromResponse
        if (!resolvedSlug) {
          try {
            const ctxRes = await fetch("/api/auth/context", { cache: "no-store" })
            const ctx = await ctxRes.json().catch(() => ({} as any))
            if (ctx?.orgSlug) {
              resolvedSlug = String(ctx.orgSlug).trim()
            }
          } catch {
            // ignore and fallback to /app/dashboard
          }
        }
        if (resolvedSlug) {
          target = target.replace(/^\/app\/dashboard/, `/app/${resolvedSlug}/dashboard`)
        }
      }
      clearPendingLogin()
      router.replace(target)
      router.refresh()
    } catch (err: any) {
      if (requestingOtp) {
        setPhase("email")
        setCode("")
        setResendCooldown(0)
      }
      setError(err?.message || "Could not sign in.")
    } finally {
      setLoading(false)
    }
  }

  const onResendCode = async () => {
    const loginId = (verifyLoginId || email).trim().toLowerCase()
    if (!loginId || resendCooldown > 0 || resendLoading) return

    setError("")
    setInfo("")
    setResendLoading(true)
    try {
      let resent = false
      let lastError = "Could not resend code"

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const res = await fetchWithTimeout(
            `${supabaseUrl}/auth/v1/otp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseAnonKey,
              },
              body: JSON.stringify({ email: loginId, create_user: false }),
            },
            6000
          )
          const data = await res.json().catch(() => ({} as any))
          if (res.ok) {
            resent = true
          } else {
            lastError = data?.error_description || data?.msg || data?.error || lastError
          }
        } catch (err: any) {
          lastError = err?.name === "AbortError" ? "Resend timed out. Please try again." : err?.message || lastError
        }
      }

      if (!resent) {
        const res = await fetchWithTimeout(
          "/api/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginId, code: "", next }),
          },
          8000
        )
        const data = await res.json().catch(() => ({} as any))
        if (!res.ok) throw new Error(data?.error || lastError)
      }

      setMaskedEmail(maskForUi(loginId))
      savePendingLogin(loginId, maskForUi(loginId))
      setInfo("A new code was sent.")
      setResendCooldown(resendCooldownSeconds)
      setOtpSendPending(false)
    } catch (err: any) {
      setError(err?.message || "Could not resend code.")
    } finally {
      setResendLoading(false)
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
            <h2 className="text-6xl leading-[1.02] font-semibold tracking-tight">Welcome back to your business command center.</h2>
            <p className="mt-5 text-3xl text-zinc-300">Fast, secure, and built for daily operations.</p>
          </div>
          <p className="text-sm text-zinc-500">Ledger, Billing, Inventory. One place.</p>
        </section>

        <section className="relative flex items-center justify-center p-6 sm:p-8 lg:p-10 min-h-svh lg:min-h-0 bg-[radial-gradient(90%_80%_at_20%_15%,#5b50d7_0%,transparent_58%),radial-gradient(90%_85%_at_80%_85%,#5b50d7_0%,transparent_60%),linear-gradient(180deg,#f2efea,#f6eee8)]">
          <Link href="/" className="absolute left-5 top-5 z-20 inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm lg:hidden">
            <Logo size={24} className="text-emerald-500" />
            <div>
              <h1 className="text-xl font-black italic leading-none">KhataPlus</h1>
              <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Secure Login</p>
            </div>
          </Link>

          <div className="w-full max-w-md rounded-3xl border border-zinc-300 bg-white/90 shadow-[0_20px_60px_rgba(16,24,40,0.20)] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-indigo-600 font-black">Secure Login</p>
              <h3 className="text-center text-5xl font-semibold tracking-tight mt-3">Sign in</h3>
              <p className="text-center text-zinc-500 mt-2">Continue to your dashboard</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 rounded-xl" placeholder="you@shop.com" disabled={phase === "verify"} required />
                </div>
              </div>

              {phase === "verify" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Verification Code</label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\s+/g, "").replace(/^#/, ""))} className="h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 tracking-[0.22em] font-black rounded-xl" placeholder="Enter 6-digit code" required />
                  <p className="text-[11px] text-zinc-500">Code sent to <span className="font-black text-zinc-800">{maskedEmail || email}</span></p>
                  <div className="flex items-center justify-between text-[11px]">
                    <button type="button" onClick={onResendCode} disabled={resendLoading || resendCooldown > 0} className="font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 disabled:text-zinc-500 disabled:cursor-not-allowed">{resendLoading ? "Sending..." : "Resend Code"}</button>
                    <span className="text-zinc-400">{resendCooldown > 0 ? `Retry in ${resendCooldown}s` : "Ready"}</span>
                  </div>
                </div>
              )}

              {error && <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
              {info && <div className="rounded-xl border border-emerald-400/40 bg-emerald-50 p-3 text-sm text-emerald-800">{info}</div>}

              <Button type="submit" disabled={loading || otpSendPending} className="w-full h-12 rounded-lg text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white">{loading || otpSendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{phase === "verify" ? "Verify & Sign In" : "Continue"} <ArrowRight className="h-4 w-4 ml-2" /></>}</Button>

              {phase === "email" && (
                <Button type="button" variant="outline" className="w-full h-12 rounded-lg text-base border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 disabled:opacity-60" onClick={openPasskeyFlow} disabled={passkeyLoading}>
                  {passkeyLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  {passkeyLoading ? "Verifying Passkey..." : "Use Passkey"}
                </Button>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">{phase === "verify" ? "Wrong email?" : "New here?"}</span>
              {phase === "verify" ? (
                <button type="button" className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700" onClick={() => { setPhase("email"); setCode(""); setError(""); setInfo(""); setVerifyLoginId(""); setMaskedEmail(""); setResendCooldown(0); clearPendingLogin() }}>
                  Change Email
                </button>
              ) : (
                <Link href={signUpHref} className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700">Create Account</Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
