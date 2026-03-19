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
        const loginId = email.trim().toLowerCase()
        setPhase("verify")
        setMaskedEmail(data?.maskedEmail || email)
        setVerifyLoginId(loginId)
        savePendingLogin(loginId, data?.maskedEmail || loginId)
        if (phase === "email") setResendCooldown(resendCooldownSeconds)
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginId, code: "", next }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Could not resend code")

      setMaskedEmail(data?.maskedEmail || loginId)
      savePendingLogin(loginId, data?.maskedEmail || loginId)
      setInfo("A new code was sent.")
      setResendCooldown(resendCooldownSeconds)
    } catch (err: any) {
      setError(err?.message || "Could not resend code.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#0b1220] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_15%_-10%,rgba(16,185,129,0.25),transparent),radial-gradient(900px_500px_at_100%_110%,rgba(14,165,233,0.24),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,18,32,0.95),rgba(17,24,39,0.98))]" />

      <Link href="/" className="absolute left-5 top-5 z-20 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur">
        <Logo size={24} className="text-emerald-300" />
        <div>
          <h1 className="text-xl font-black italic leading-none">KhataPlus</h1>
          <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-300">Secure Login</p>
        </div>
      </Link>

      <div className="relative z-10 min-h-svh grid lg:grid-cols-[1.1fr_540px]">
        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300 mb-6">Account Access</p>
          <h2 className="text-6xl font-black leading-[0.88] tracking-[-0.03em]">Sign In.<span className="block text-emerald-300">Run Your Store.</span></h2>
          <p className="mt-6 text-zinc-300 max-w-md font-medium">OTP-first login with optional passkey. Fast access for billing, inventory, and ledger operations.</p>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300 font-black">Welcome Back</p>
              <h3 className="text-3xl font-black tracking-tight mt-1">Sign in to continue</h3>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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
                  <div className="flex items-center justify-between text-[11px]">
                    <button type="button" onClick={onResendCode} disabled={resendLoading || resendCooldown > 0} className="font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200 disabled:text-zinc-500 disabled:cursor-not-allowed">{resendLoading ? "Sending..." : "Resend Code"}</button>
                    <span className="text-zinc-400">{resendCooldown > 0 ? `Retry in ${resendCooldown}s` : "Ready"}</span>
                  </div>
                </div>
              )}

              {error && <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
              {info && <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div>}

              <Button type="submit" disabled={loading} className="w-full h-11 text-xs uppercase tracking-widest font-black bg-emerald-500 hover:bg-emerald-400 text-zinc-950">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{phase === "verify" ? "Verify & Sign In" : "Send Login Code"} <ArrowRight className="h-4 w-4 ml-2" /></>}</Button>

              {phase === "email" && (
                <Button type="button" variant="outline" className="w-full h-11 text-xs uppercase tracking-widest font-black border-white/25 bg-white/5 hover:bg-white/10 text-zinc-100 disabled:opacity-60" onClick={openPasskeyFlow} disabled={passkeyLoading}>
                  {passkeyLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  {passkeyLoading ? "Verifying Passkey..." : "Use Passkey"}
                </Button>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">{phase === "verify" ? "Wrong email?" : "New here?"}</span>
              {phase === "verify" ? (
                <button type="button" className="text-emerald-300 font-black uppercase tracking-widest hover:text-emerald-200" onClick={() => { setPhase("email"); setCode(""); setError(""); setInfo(""); setVerifyLoginId(""); setMaskedEmail(""); setResendCooldown(0); clearPendingLogin() }}>
                  Change Email
                </button>
              ) : (
                <Link href={signUpHref} className="text-emerald-300 font-black uppercase tracking-widest hover:text-emerald-200">Create Account</Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
