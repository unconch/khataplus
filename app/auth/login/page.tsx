"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { Descope } from "@descope/nextjs-sdk"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Loader2, Mail, ShieldCheck, KeyRound, X } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = useMemo(() => {
    const raw = searchParams.get("next")
    if (!raw) return "/dashboard"
    if (!raw.startsWith("/") || raw.startsWith("/auth/")) return "/dashboard"
    return raw
  }, [searchParams])

  const signUpHref = `/auth/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`
  const promotePasskeyFlowId = process.env.NEXT_PUBLIC_DESCOPE_PROMOTE_PASSKEYS_FLOW_ID || ""
  const passkeyFlowCandidates = useMemo(
    () =>
      [
        process.env.NEXT_PUBLIC_DESCOPE_PASSKEY_LOGIN_FLOW_ID,
      ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i),
    []
  )
  const canUsePasskey = passkeyFlowCandidates.length > 0

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<"email" | "verify">("email")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [verifyLoginId, setVerifyLoginId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPasskeyFlow, setShowPasskeyFlow] = useState(false)
  const [passkeyFlowIndex, setPasskeyFlowIndex] = useState(0)
  const [passkeyFlowChecking, setPasskeyFlowChecking] = useState(false)
  const [showPostLoginPasskeyPrompt, setShowPostLoginPasskeyPrompt] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState(next || "/dashboard")

  const validateFlowId = async (flowId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/auth/descope/validate-flow?flowId=${encodeURIComponent(flowId)}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({} as any))
      return Boolean(data?.ok)
    } catch {
      return false
    }
  }

  const openPasskeyFlow = async () => {
    if (!canUsePasskey) {
      setError("Passkey login flow is not configured.")
      return
    }

    setError("")
    setPasskeyFlowChecking(true)
    try {
      for (let i = 0; i < passkeyFlowCandidates.length; i++) {
        const flowId = passkeyFlowCandidates[i]
        const valid = await validateFlowId(flowId)
        if (valid) {
          setPasskeyFlowIndex(i)
          setShowPasskeyFlow(true)
          return
        }
      }
      setShowPasskeyFlow(false)
      setError("Passkey flow ID is invalid in Descope. Update NEXT_PUBLIC_DESCOPE_PASSKEY_LOGIN_FLOW_ID.")
    } finally {
      setPasskeyFlowChecking(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: phase === "verify" ? (verifyLoginId || email) : email,
          code: phase === "verify" ? code : "",
          next,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || "Login failed")
      if (data?.phase === "verify") {
        setPhase("verify")
        setMaskedEmail(data?.maskedEmail || email)
        setVerifyLoginId(email.trim().toLowerCase())
        return
      }
      const target = data?.next || next || "/dashboard"
      if (!promotePasskeyFlowId) {
        router.replace(target)
        router.refresh()
        return
      }
      setPendingRedirect(target)
      setShowPostLoginPasskeyPrompt(true)
    } catch (err: any) {
      setError(err?.message || "Could not sign in.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh w-full bg-[#0a1012] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,0.28),transparent_38%)]" />
      <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-[24rem] w-[24rem] rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px]" />
      <Link href="/" className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20 inline-flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl">
          <Logo size={28} className="text-emerald-300" />
        </div>
        <div>
          <h1 className="text-[1.85rem] font-black italic tracking-tight leading-none">KhataPlus</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-300">Sales + Ledger OS</p>
        </div>
      </Link>

      <div className="relative z-10 min-h-svh flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <div className="w-full max-w-[90rem] max-h-[calc(100svh-1.5rem)] grid items-center gap-4 lg:grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_minmax(420px,560px)_minmax(260px,1fr)]">
          <aside className="hidden xl:flex flex-col gap-8 px-4 py-2 justify-center">
            <div />

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-black text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
                Secure Access
              </div>
              <h2 className="text-[clamp(2.2rem,3.3vw,3.5rem)] font-black leading-[0.94] tracking-[-0.035em]">
                Sign in.
                <span className="block text-emerald-300">Stay in control.</span>
              </h2>
              <p className="text-zinc-300 text-base font-semibold max-w-sm leading-relaxed">
                Unified billing, inventory and ledgers with security-first access.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Session Tokens
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Encrypted</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Device Controls
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Step-up Actions
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">OTP Ready</span>
              </div>
            </div>
          </aside>

          <section className="relative flex items-center justify-center py-1">
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(16,185,129,0.26)_0%,rgba(16,185,129,0.06)_45%,transparent_72%)] blur-2xl" />
            <div className="relative w-full max-w-[min(560px,92vw)] rounded-[2rem] border border-white/30 bg-white/[0.14] backdrop-blur-3xl p-6 md:p-8 ring-1 ring-white/20 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
                <Logo size={28} className="text-emerald-300" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Sign In</h1>
                <p className="text-xs text-zinc-300">Access your KhataPlus workspace</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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
                className="w-full h-11 text-xs uppercase tracking-widest font-black bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{phase === "verify" ? "Verify & Sign In" : "Send Login Code"} <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
              {phase === "email" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-xs uppercase tracking-widest font-black border-white/25 bg-white/5 hover:bg-white/10 text-zinc-100 disabled:opacity-60"
                  onClick={openPasskeyFlow}
                  disabled={!canUsePasskey || passkeyFlowChecking}
                >
                  {passkeyFlowChecking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  {passkeyFlowChecking ? "Checking Passkey Flow..." : "Use Passkey"}
                </Button>
              )}
            </form>
            {!canUsePasskey && phase === "email" && (
              <p className="text-[11px] text-amber-200/90 mt-3">
                Passkey login is not configured. Set <span className="font-black">NEXT_PUBLIC_DESCOPE_PASSKEY_LOGIN_FLOW_ID</span>.
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">{phase === "verify" ? "Wrong email?" : "New here?"}</span>
              {phase === "verify" ? (
                <button
                  type="button"
                  className="text-emerald-300 font-black uppercase tracking-widest hover:text-emerald-200"
                  onClick={() => { setPhase("email"); setCode(""); setError(""); setVerifyLoginId("") }}
                >
                  Change Email
                </button>
              ) : (
                <Link href={signUpHref} className="text-emerald-300 font-black uppercase tracking-widest hover:text-emerald-200">
                  Create Account
                </Link>
              )}
            </div>
            </div>
          </section>

          <aside className="hidden xl:flex flex-col gap-6 px-4 py-2 justify-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-black text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                Live Security Posture
              </div>
              <h3 className="text-[clamp(2rem,2.6vw,2.6rem)] font-black tracking-tight leading-[0.95]">Workspace Health</h3>
              <p className="text-sm text-zinc-300 font-semibold max-w-sm">Session posture and sign-in readiness for this workspace.</p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-300/30">OTP ON</span>
              <span className="px-2 py-1 rounded-full bg-sky-400/15 text-sky-200 border border-sky-300/30">EMAIL VERIFIED</span>
              <span className="px-2 py-1 rounded-full bg-zinc-500/20 text-zinc-200 border border-white/15">DEVICE BOUND</span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full border border-emerald-300/45 text-emerald-200 text-[11px] font-black flex items-center justify-center mt-0.5">1</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Auth Mode</p>
                  <p className="text-xl font-black mt-1 leading-none">Passwordless OTP</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full border border-emerald-300/45 text-emerald-200 text-[11px] font-black flex items-center justify-center mt-0.5">2</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Trust Signals</p>
                  <p className="text-lg font-black mt-1 leading-tight">Email verified + device-bound session</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full border border-emerald-300/45 text-emerald-200 text-[11px] font-black flex items-center justify-center mt-0.5">3</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Post Login</p>
                  <p className="text-lg font-black mt-1 leading-tight">Dashboard in one redirect</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-300 font-semibold leading-relaxed pt-4 border-t border-white/10">
              Tip: use your primary business email for smoother team invites and ownership actions.
            </div>
          </aside>
        </div>
      </div>

      {showPasskeyFlow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#0f1418]/95 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-black tracking-tight">Passkey Login</h2>
                <p className="text-[11px] text-zinc-300">Use your device passkey for faster sign in</p>
              </div>
              <button
                type="button"
                aria-label="Close passkey dialog"
                className="h-8 w-8 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                onClick={() => setShowPasskeyFlow(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 bg-white">
              {canUsePasskey ? (
                <Descope
                  key={passkeyFlowCandidates[passkeyFlowIndex] || "fallback-flow"}
                  flowId={passkeyFlowCandidates[passkeyFlowIndex] || ""}
                  onSuccess={() => {
                    router.replace(`/auth/callback?next=${encodeURIComponent(next || "/dashboard")}`)
                    router.refresh()
                  }}
                  onError={() => {
                    const nextIndex = passkeyFlowIndex + 1
                    if (nextIndex < passkeyFlowCandidates.length) {
                      setPasskeyFlowIndex(nextIndex)
                      return
                    }
                    setShowPasskeyFlow(false)
                    setError("Passkey flow ID is invalid in Descope. Set NEXT_PUBLIC_DESCOPE_PASSKEY_LOGIN_FLOW_ID to a real sign-in flow.")
                  }}
                  theme="light"
                  debug={false}
                />
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  No passkey sign-in flow configured.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPostLoginPasskeyPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#0f1418]/95 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-base font-black tracking-tight">Enable Quick Login</h2>
              <p className="text-[11px] text-zinc-300">Add a passkey on this device for OTP-less sign in.</p>
            </div>
            <div className="p-3 bg-white">
              {promotePasskeyFlowId ? (
                <Descope
                  key={promotePasskeyFlowId}
                  flowId={promotePasskeyFlowId}
                  onSuccess={() => {
                    setShowPostLoginPasskeyPrompt(false)
                    router.replace(pendingRedirect)
                    router.refresh()
                  }}
                  onError={() => {
                    setShowPostLoginPasskeyPrompt(false)
                    router.replace(pendingRedirect)
                    router.refresh()
                  }}
                  theme="light"
                  debug={false}
                />
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Passkey setup flow is not configured.
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-white/10 bg-zinc-950">
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
                onClick={() => {
                  setShowPostLoginPasskeyPrompt(false)
                  router.replace(pendingRedirect)
                  router.refresh()
                }}
              >
                Skip For Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
