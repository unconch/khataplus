"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/ui/logo"
import { ArrowRight, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Script from "next/script"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otp, setOtp] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const inviteToken = searchParams.get("invite")
        if (inviteToken) {
          router.replace(`/invite/${inviteToken}`)
          return
        }
        router.replace("/dashboard")
      }
    }
    checkUser()
  }, [router, supabase.auth, searchParams])

  const acceptInviteToken = async (token: string) => {
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to accept invite")
      if (data?.orgSlug) {
        router.push(`/${data.orgSlug}/dashboard`)
        return true
      }
      return true
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept invite")
      return false
    }
  }

  const requirements = [
    { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
    { label: "At least one lowercase letter", check: (p: string) => /[a-z]/.test(p) },
    { label: "At least one uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
    { label: "At least one number", check: (p: string) => /[0-9]/.test(p) },
  ]

  const unmetRequirements = requirements.filter(r => !r.check(password))
  const isPasswordStrong = unmetRequirements.length === 0

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      const inviteToken = searchParams.get("invite")
      let { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          data = { user: session.user, session } as any;
          error = null;
        }
      }

      if (error) throw error;

      if (data?.user) {
        try {
          const cookies = document.cookie.split('; ');
          const referralCookie = cookies.find(row => row.startsWith('kp_referral='));
          const referrerCode = referralCookie ? referralCookie.split('=')[1] : undefined;

          const [{ ensureProfile, getUserOrganizations }] = await Promise.all([
            import("@/lib/data"),
          ]);

          const [userOrgs] = await Promise.all([
            getUserOrganizations(data.user.id),
            ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.full_name, undefined, referrerCode).catch(e => console.error("Sync error:", e))
          ]);

          if (inviteToken) {
            const accepted = await acceptInviteToken(inviteToken)
            if (accepted) return
          }

          if (userOrgs && userOrgs.length > 0) {
            toast.success("Welcome back!");
            router.push(`/${userOrgs[0].organization.slug}/dashboard`);
            return;
          }
        } catch (err) {
          console.error("[GIS Fast-Path Error]:", err);
        }

        toast.success("Account verified!");
        if (inviteToken) {
          const accepted = await acceptInviteToken(inviteToken)
          if (accepted) return
        }
        router.push("/setup-organization");
      }
    } catch (err: any) {
      console.error("[GIS Error]:", err);
      if (err.message?.includes("unexpected response")) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/setup-organization");
          return;
        }
      }
      toast.error(err.message || "Google sign-up failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLoad = async () => {
    if (typeof window !== "undefined" && (window as any).google) {
      const google = (window as any).google;

      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      const buttonDiv = document.getElementById("google-button-signup");
      if (buttonDiv) {
        google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signup_with",
          shape: "rectangular"
        });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleGoogleLoad();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !isPasswordStrong) {
      toast.error("Please meet all password requirements")
      return
    }
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError || !data?.user) {
      toast.error(authError?.message || "Authentication failed")
      setLoading(false)
      return
    }

    setLoading(false)
    setIsSuccess(true)
    toast.success("Verification code sent!")
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit code")
      return
    }
    setVerifyingOtp(true)

    try {
      const inviteToken = searchParams.get("invite")
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      })

      if (error) throw error

      if (data?.user) {
        try {
          const cookies = document.cookie.split('; ');
          const referralCookie = cookies.find(row => row.startsWith('kp_referral='));
          const referrerCode = referralCookie ? referralCookie.split('=')[1] : undefined;

          const { ensureProfile } = await import("@/lib/data/profiles")
          await ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.full_name, undefined, referrerCode)
        } catch (syncErr) {
          console.error("[OTP] Profile sync failed:", syncErr)
        }
        toast.success("Account verified!")
        if (inviteToken) {
          const accepted = await acceptInviteToken(inviteToken)
          if (accepted) return
        }
        router.push("/setup-organization")
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired code")
      setVerifyingOtp(false)
    }
  }

  const benefits = [
    "GST-compliant invoicing",
    "Real-time inventory tracking",
    "Works offline on any device",
    "Khata (credit) management",
  ]

  const PasswordRequirement = ({ label, met, showChecked }: { label: string; met: boolean; showChecked: boolean }) => (
    <div className={cn(
      "flex items-center gap-2 text-[11px] transition-colors",
      met ? "text-emerald-500" : showChecked ? "text-red-500" : "text-zinc-400"
    )}>
      {met ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1 w-1 rounded-full bg-current ml-1 mr-1" />}
      {label}
    </div>
  )

  return (
    <div className="h-svh w-full flex overflow-hidden bg-zinc-950">
      {/* Left Panel - Branding (Premium Immersive) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-white/5 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[size:32px_32px] z-10" />
        <div className="absolute inset-0 mesh-gradient opacity-30" />

        <div className="absolute top-[-15%] left-[-10%] w-[90%] h-[90%] bg-teal-700/20 rounded-full blur-[140px] animate-orbit" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[80%] h-[80%] bg-blue-700/15 rounded-full blur-[140px] animate-orbit-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-lime-500/10 rounded-full blur-[120px]" />

        <div className="relative z-20 flex flex-col w-full h-full pt-8 pb-12 px-12 xl:pt-12 xl:pb-20 xl:px-20 text-white">
          <div className="animate-in fade-in slide-left duration-700">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="p-3 bg-white/10 backdrop-blur-xl rounded-[22px] border border-white/20 shadow-2xl group-hover:scale-110 transition-all duration-500">
                <Logo size={48} className="text-white" />
              </div>
              <span className="font-black text-4xl tracking-tighter uppercase italic">KhataPlus</span>
            </Link>
          </div>

          <div className="mt-4 mb-auto space-y-6">
            <div className="animate-in fade-in slide-up duration-1000 delay-200">
              <h1 className="text-[85px] xl:text-[110px] font-[1000] leading-[0.78] tracking-[-0.07em] uppercase italic mb-10">
                Manage<br />
                <span className="text-[#10b981]">Smarter.</span>
              </h1>
              <p className="text-xl text-zinc-400 max-w-sm font-bold leading-relaxed tracking-tight">
                Experience the next generation of business management with India's most powerful OS.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {benefits.map((benefit, idx) => (
                <div
                  key={benefit}
                  className="flex items-center gap-5 group animate-in fade-in slide-left"
                  style={{ animationDelay: `${600 + (idx * 150)}ms` }}
                >
                  <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all duration-500">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <span className="text-lg font-bold text-zinc-300 group-hover:text-white transition-colors">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (Liquid Glass Centered) */}
      <div className="flex-1 h-full bg-[#f8fafc] dark:bg-zinc-950 relative flex items-center justify-center p-6 md:p-12">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08),transparent_70%)]" />
        </div>

        <div className="w-full max-w-[380px] space-y-7 relative z-10">
          {!isSuccess ? (
            <div className="space-y-7">
              <div className="text-center space-y-4">
                <h2 className="text-[54px] font-[1000] text-zinc-900 dark:text-white tracking-[-0.07em] leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  Digital <span className="text-[#9333ea] inline-block animate-pulse-subtle">India Era.</span>
                </h2>
                <p className="text-base text-zinc-500 font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1200 delay-300">
                  Empowering India's next generation of entrepreneurs.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4 animate-in fade-in slide-up duration-1000 delay-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 px-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-4 rounded-[20px] bg-[#f4f4f5] dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/5 focus:ring-0 focus:border-zinc-400 outline-none transition-all font-bold text-zinc-600 placeholder:text-zinc-400 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 px-1">Set Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-6 py-4 rounded-[20px] bg-[#f4f4f5] dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/5 focus:ring-0 focus:border-zinc-400 outline-none transition-all font-bold text-zinc-600 pr-12 placeholder:text-zinc-400 text-sm"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 px-1">
                      {requirements.map((r, i) => (
                        <PasswordRequirement key={i} label={r.label} met={r.check(password)} showChecked={true} />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordStrong}
                  className={cn(
                    "w-full py-5 rounded-[22px] font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-zinc-200/80 relative overflow-hidden group bg-white",
                    (loading || !isPasswordStrong)
                      ? "text-zinc-300 opacity-60 cursor-not-allowed"
                      : "text-zinc-900 hover:bg-zinc-50 active:scale-[0.98] hover:shadow-xl"
                  )}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-zinc-900" /> : (
                    <>
                      Sign Up Now
                      <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-6 animate-in fade-in slide-up duration-1000 delay-700">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-zinc-200/80" />
                  <div className="absolute px-4 bg-transparent dark:bg-zinc-950">
                    <span className="px-5 py-1.5 rounded-full bg-[#f4f4f5] border border-zinc-200 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      Social Connect
                    </span>
                  </div>
                </div>

                <div className="flex justify-center pt-1">
                  <div className="w-full bg-white border border-zinc-200 rounded-[18px] p-0.5 shadow-sm overflow-hidden flex justify-center items-center">
                    <Script src="https://accounts.google.com/gsi/client" onLoad={handleGoogleLoad} strategy="afterInteractive" />
                    <div id="google-button-signup" className="w-full h-[48px] flex items-center justify-center" />
                  </div>
                </div>
              </div>

              <div className="text-center pt-3 animate-in fade-in slide-up duration-1000 delay-800">
                <p className="text-sm font-bold text-zinc-500">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-[#9333ea] hover:opacity-80 inline-flex items-center gap-1 group font-[1000]">
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </p>
                <div className="mt-3 pt-2 border-t border-zinc-200/50">
                  <Link href="/demo" className="text-[10px] font-[1000] uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                    Or try the demo without signing up {"->"}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in scale-in">
              <div className="text-center space-y-3">
                <h3 className="text-[32px] font-[1000] text-zinc-900 dark:text-white uppercase italic tracking-tighter">Verify Code</h3>
                <p className="text-[15px] text-zinc-500 font-bold max-w-xs mx-auto">Sent to <span className="text-[#9333ea]">{email}</span></p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-[44px] tracking-[0.4em] font-black py-7 rounded-[22px] bg-[#f4f4f5] dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 outline-none focus:ring-0 focus:border-zinc-400 transition-all text-zinc-600"
                  placeholder="000000"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length < 6}
                  className={cn(
                    "w-full py-6 rounded-[22px] font-black uppercase tracking-widest transition-all",
                    (verifyingOtp || otp.length < 6)
                      ? "bg-[#f4f4f5] text-zinc-400 border border-zinc-200"
                      : "bg-[#10b981] text-white hover:bg-[#059669] shadow-xl shadow-emerald-600/20"
                  )}
                >
                  Confirm Access
                </button>
              </form>

              <div className="flex flex-col gap-3 text-center">
                <button onClick={handleSignUp} className="text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">Resend Code</button>
                <button onClick={() => setIsSuccess(false)} className="text-[11px] font-bold text-[#9333ea]">Change Email</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
