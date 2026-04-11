"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "@/components/locale-provider"
import { getLocaleCopy } from "@/lib/locale-copy"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Loader2, Mail, UserRound } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const copy = getLocaleCopy(locale)

  const next = useMemo(() => {
    const raw = searchParams.get("next")
    if (!raw) return "/onboarding"
    if (!raw.startsWith("/") || raw.startsWith("/auth/")) return "/onboarding"
    return raw
  }, [searchParams])

  const loginHref = `/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
  const pendingRegistrationStorageKey = "kp_registration_pending"
  const pendingRegistrationMaxAgeMs = 1000 * 60 * 15

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<"email" | "verify">("email")
  const [verifyLoginId, setVerifyLoginId] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const codeInputRef = useRef<HTMLInputElement | null>(null)

  const clearPendingRegistration = () => {
    if (typeof window === "undefined") return
    window.sessionStorage.removeItem(pendingRegistrationStorageKey)
  }

  const savePendingRegistration = (pendingName: string, pendingEmail: string) => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(
      pendingRegistrationStorageKey,
      JSON.stringify({
        name: pendingName,
        email: pendingEmail,
        createdAt: Date.now(),
      })
    )
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.sessionStorage.getItem(pendingRegistrationStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { name?: string; email?: string; createdAt?: number }
      const pendingName = String(parsed?.name || "").trim()
      const pendingEmail = String(parsed?.email || "").trim().toLowerCase()
      const createdAt = Number(parsed?.createdAt || 0)
      if (!pendingName || !pendingEmail || !createdAt || Date.now() - createdAt > pendingRegistrationMaxAgeMs) {
        clearPendingRegistration()
        return
      }
      setName(pendingName)
      setEmail(pendingEmail)
      setVerifyLoginId(pendingEmail)
      setPhase("verify")
    } catch {
      clearPendingRegistration()
    }
  }, [])

  useEffect(() => {
    fetch("/api/auth/register", { method: "GET", cache: "no-store" }).catch(() => undefined)
  }, [])

  useEffect(() => {
    const activeInput = phase === "verify" ? codeInputRef.current : emailInputRef.current
    if (!activeInput) return

    const timer = window.setTimeout(() => {
      activeInput.focus()
      if (phase === "verify") {
        activeInput.select()
      }
    }, 120)

    return () => window.clearTimeout(timer)
  }, [phase])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setInfo("")
    const normalizedEmail = email.trim().toLowerCase()
    const requestingOtp = phase === "email"
    if (requestingOtp && normalizedEmail) {
      setPhase("verify")
      setVerifyLoginId(normalizedEmail)
      setInfo(copy.signUp.verificationPlaceholder)
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: phase === "verify" ? verifyLoginId || normalizedEmail : normalizedEmail,
          code: phase === "verify" ? code : "",
          next,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || copy.signUp.registrationFailed)
      if (data?.phase === "verify") {
        setPhase("verify")
        setVerifyLoginId(normalizedEmail)
        savePendingRegistration(name.trim(), normalizedEmail)
        setInfo(copy.signUp.verifyEmailContinue)
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
      clearPendingRegistration()
      router.replace(target)
      router.refresh()
    } catch (err: any) {
      if (requestingOtp) {
        setPhase("email")
        setVerifyLoginId("")
      }
      setError(err?.message || copy.signUp.couldNotCreateAccount)
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
            <h2 className="text-6xl leading-[1.02] font-semibold tracking-tight">{copy.signUp.heroTitle}</h2>
            <p className="mt-5 text-3xl text-zinc-300">{copy.signUp.heroSubtitle}</p>
          </div>
          <p className="text-sm text-zinc-500">{copy.signUp.heroFootnote}</p>
        </section>

        <section className="relative flex items-center justify-center p-6 sm:p-8 lg:p-10 min-h-svh lg:min-h-0 bg-[radial-gradient(90%_80%_at_20%_15%,#5b50d7_0%,transparent_58%),radial-gradient(90%_85%_at_80%_85%,#5b50d7_0%,transparent_60%),linear-gradient(180deg,#f2efea,#f6eee8)]">
          <Link
            href="/"
            className="absolute left-5 top-5 z-20 inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm lg:hidden"
          >
            <Logo size={24} className="text-emerald-500" />
            <div>
              <h1 className="text-xl font-black italic leading-none">KhataPlus</h1>
              <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">{copy.signUp.createAccount}</p>
            </div>
          </Link>

          <div className="w-full max-w-md rounded-3xl border border-zinc-300 bg-white/90 shadow-[0_20px_60px_rgba(16,24,40,0.20)] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-indigo-600 font-black">{copy.signUp.createAccount}</p>
              <h3 className="text-center text-5xl font-semibold tracking-tight mt-3">{copy.signUp.signUp}</h3>
              <p className="text-center text-zinc-500 mt-2">{copy.signUp.verifyEmailContinue}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{copy.signUp.fullName}</label>
                <div className="relative">
                  <UserRound className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 rounded-xl read-only:bg-white read-only:text-zinc-900 read-only:opacity-100 read-only:cursor-default"
                    placeholder={copy.signUp.yourName}
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    readOnly={phase === "verify"}
                    aria-readonly={phase === "verify"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{copy.signUp.email}</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 rounded-xl read-only:bg-white read-only:text-zinc-900 read-only:opacity-100 read-only:cursor-default"
                    placeholder={copy.signUp.emailPlaceholder}
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    enterKeyHint="next"
                    readOnly={phase === "verify"}
                    aria-readonly={phase === "verify"}
                    required
                  />
                </div>
              </div>

              {phase === "verify" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{copy.signUp.verificationCode}</label>
                  <Input
                    ref={codeInputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\s+/g, "").replace(/^#/, ""))}
                    className="h-12 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 tracking-[0.22em] font-black rounded-xl"
                    placeholder={copy.signUp.verificationPlaceholder}
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="numeric"
                    enterKeyHint="done"
                    maxLength={6}
                    pattern="[0-9]*"
                    required
                  />
                </div>
              )}

              {info && <div className="rounded-xl border border-emerald-400/40 bg-emerald-50 p-3 text-sm text-emerald-800">{info}</div>}

              {error && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:!opacity-100 disabled:!bg-indigo-600 disabled:!text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {phase === "verify" ? copy.signUp.verifyAndCreateAccount : copy.signUp.continue}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">{phase === "verify" ? copy.signUp.wrongEmail : copy.signUp.alreadyHaveAccount}</span>
              {phase === "verify" ? (
                <button
                  type="button"
                  className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700"
                  onClick={() => {
                    setPhase("email")
                    setCode("")
                    setError("")
                    setInfo("")
                    setVerifyLoginId("")
                    clearPendingRegistration()
                  }}
                >
                  {copy.signUp.changeEmail}
                </button>
              ) : (
                <Link href={loginHref} className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700">
                  {copy.signUp.signIn}
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
