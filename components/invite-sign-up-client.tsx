"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Loader2, UserPlus } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

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
    path === "/onboarding" ||
    path.startsWith("/onboarding/") ||
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    /^\/[^/]+\/dashboard(?:\/|$)/.test(path) ||
    path === "/invite" ||
    path.startsWith("/invite/")
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

type InviteSignUpClientProps = {
  slugHint?: string
}

export function InviteSignUpClient({ slugHint = "" }: InviteSignUpClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite") || ""
  const next = useMemo(
    () => (inviteToken ? `/invite/${encodeURIComponent(inviteToken)}` : "/onboarding"),
    [inviteToken]
  )

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isInviteLoading, setIsInviteLoading] = useState(true)
  const [isValidInvite, setIsValidInvite] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [role, setRole] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!inviteToken) {
      setIsInviteLoading(false)
      setIsValidInvite(false)
      return
    }

    let active = true
    const validateInvite = async () => {
      try {
        const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}`)
        const data = await res.json().catch(() => ({} as any))
        if (!res.ok) throw new Error(data?.error || "Invalid invite")
        if (!active) return

        const apiSlug = String(data?.orgSlug || "")
        if (slugHint && apiSlug && slugHint.toLowerCase() !== apiSlug.toLowerCase()) {
          throw new Error("Invite does not belong to this organization")
        }

        setIsValidInvite(true)
        setOrgName(String(data?.orgName || "your organization"))
        setOrgSlug(apiSlug)
        setRole(String(data?.role || "staff"))
        setOwnerName(String(data?.ownerName || ""))
        setOwnerEmail(String(data?.ownerEmail || ""))
        if (data?.email) {
          setEmail(String(data.email))
        }
      } catch (err: any) {
        if (!active) return
        setIsValidInvite(false)
        toast.error(err?.message || "Invalid or expired invite link")
      } finally {
        if (active) setIsInviteLoading(false)
      }
    }

    void validateInvite()
    return () => {
      active = false
    }
  }, [inviteToken, slugHint])

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

      toast.success("Account verified! Joining organization...")
      redirectAfterAuth(data?.next || next)
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired code")
      setVerifyingOtp(false)
    }
  }

  if (isInviteLoading) {
    return (
      <div className="min-h-svh w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" />
          Validating invite...
        </div>
      </div>
    )
  }

  if (!inviteToken || !isValidInvite) {
    return (
      <div className="min-h-svh w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-4">
          <h1 className="text-2xl font-black tracking-tight">Invalid Invite</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This invite link is invalid or expired. Ask your organization admin for a new invite.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const ownerDisplay = ownerName || ownerEmail

  return (
    <div className="min-h-svh w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Join {orgName}</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Invited as {role}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 space-y-1.5">
          <p>Organization: <span className="font-black text-zinc-900 dark:text-zinc-100">{orgName}</span></p>
          {orgSlug ? <p>Slug: <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">{orgSlug}</span></p> : null}
          {ownerDisplay ? <p>Primary Owner: <span className="font-black text-zinc-900 dark:text-zinc-100">{ownerDisplay}</span></p> : null}
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/40 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/40 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email}
              className={cn(
                "w-full py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2",
                loading || !name || !email
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90"
              )}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send Verification Code <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Enter the 6-digit code sent to <span className="font-bold text-zinc-900 dark:text-zinc-100">{email}</span>
            </p>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full text-center text-3xl tracking-[1em] font-black py-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/40 outline-none"
              placeholder="000000"
              autoFocus
            />
            <button
              type="submit"
              disabled={verifyingOtp || otp.length < 6}
              className={cn(
                "w-full py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2",
                verifyingOtp || otp.length < 6
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:opacity-90"
              )}
            >
              {verifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Join Team"}
            </button>

            <button
              type="button"
              onClick={() => handleSignUp()}
              disabled={loading}
              className="w-full py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
            >
              Resend code
            </button>
          </form>
        )}

        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in to accept invite
          </Link>
        </div>

        <div className="flex items-center justify-center">
          <Logo size={24} className="text-zinc-400" />
        </div>
      </div>
    </div>
  )
}
