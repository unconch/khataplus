"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/ui/logo"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, CheckCircle2, Sparkles, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Script from "next/script"

export default function SignUpPage() {
  const router = useRouter()
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
        router.replace("/dashboard")
      }
    }
    checkUser()
  }, [router, supabase.auth])

  // Password Requirements Logic
  const requirements = [
    { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
    { label: "At least one lowercase letter", check: (p: string) => /[a-z]/.test(p) },
    { label: "At least one uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
    { label: "At least one number", check: (p: string) => /[0-9]/.test(p) },
  ]

  const unmetRequirements = requirements.filter(r => !r.check(password))
  const isPasswordStrong = unmetRequirements.length === 0

  // Handle GIS Credential Response
  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      let { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      // Fail-safe: If we get a generic error but the session actually worked
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
          // Get referral code from cookie
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

          if (userOrgs && userOrgs.length > 0) {
            toast.success("Welcome back!");
            router.push(`/${userOrgs[0].organization.slug}/dashboard`);
            return;
          }
        } catch (err) {
          console.error("[GIS Fast-Path Error]:", err);
        }

        toast.success("Account verified!");
        router.push("/setup-organization");
      }
    } catch (err: any) {
      console.error("[GIS Error]:", err);
      // Suppress false-positives
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

  // Re-initialize Google Login if script is already loaded
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

    console.log("[SignUp] Attempting sign-up for:", email)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    console.log("[SignUp] Response:", { data, error: authError })

    if (authError || !data?.user) {
      console.error("[SignUp] Error:", authError)
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
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      })

      if (error) throw error

      if (data?.user) {
        try {
          // Get referral code from cookie
          const cookies = document.cookie.split('; ');
          const referralCookie = cookies.find(row => row.startsWith('kp_referral='));
          const referrerCode = referralCookie ? referralCookie.split('=')[1] : undefined;

          const { ensureProfile } = await import("@/lib/data/profiles")
          await ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.full_name, undefined, referrerCode)
        } catch (syncErr) {
          console.error("[OTP] Profile sync failed:", syncErr)
        }
        toast.success("Account verified!")
        router.push("/setup-organization")
      }
    } catch (err: any) {
      console.error("[OTP Error]:", err)
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
    <div className="min-h-svh w-full flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        {/* Mesh Background */}
        <div className="absolute inset-0 mesh-gradient opacity-60" />

        {/* Overlay to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-0" />

        {/* Animated Overlays for Depth */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-violet-600/20 rounded-full blur-[120px] animate-orbit" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[120px] animate-orbit-slow" />
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] z-1" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 flex flex-col w-full p-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-auto"
          >
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                <Logo size={32} className="text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter">KhataPlus</span>
            </Link>
          </motion.div>

          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <h1 className="text-6xl xl:text-7xl font-black leading-[0.9] tracking-tighter mb-6">
                Manage<br />
                <span className="text-emerald-400">Smarter.</span>
              </h1>
              <p className="text-xl text-white/70 max-w-sm font-medium leading-relaxed">
                Experience the next generation of business management with India's most powerful OS.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 gap-6"
            >
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="flex items-center gap-4 group cursor-default"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-emerald-500/40 group-hover:scale-110 transition-all duration-300 shadow-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors drop-shadow-md">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="mt-auto pt-12 border-t border-white/10">
            <p className="text-sm text-white/40 font-medium">© 2026 KhataPlus Online. All rights reserved.</p>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4 text-center lg:text-left">
                  <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                    Digital <span className="text-purple-600">India Era.</span>
                  </h2>
                  <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium font-outfit">Empowering India's next generation of entrepreneurs.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Set Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold pr-12 placeholder:text-zinc-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Password Requirements Checklist */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1.5 pt-1 pl-1"
                      >
                        {requirements.map((r, i) => (
                          <PasswordRequirement
                            key={i}
                            label={r.label}
                            met={r.check(password)}
                            showChecked={password.length > 0}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !isPasswordStrong}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group tracking-tight",
                      (loading || !isPasswordStrong)
                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border-2 border-zinc-200 dark:border-zinc-800"
                        : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 translate-y-[-2px] hover:translate-y-[-4px]"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                      <>
                        Sign Up Now
                        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative mt-12 mb-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    <span className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 px-3 py-1 rounded-full shadow-sm">
                      Social Connect
                    </span>
                  </div>
                </div>

                <div className="w-full relative py-2 flex justify-center">
                  <div className="relative w-full flex justify-center items-center">
                    <Script
                      src="https://accounts.google.com/gsi/client"
                      onLoad={handleGoogleLoad}
                      strategy="afterInteractive"
                    />
                    <div id="google-button-signup" className="w-full flex justify-center items-center py-2" />
                    {loading && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 flex items-center justify-center rounded-xl z-20">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white italic tracking-tighter">Verify Code</h3>
                  <div className="space-y-4">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      We've sent a 6-digit verification code to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>.
                      Please enter it below to activate your account.
                    </p>


                    <form onSubmit={handleVerifyOtp} className="space-y-6 pt-2">
                      <div className="relative group">
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className="w-full text-center text-3xl tracking-[1.2em] font-black py-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                          placeholder="000000"
                          autoFocus
                        />
                        <div className="absolute inset-x-4 bottom-5 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent group-focus-within:via-emerald-500/50" />
                      </div>

                      <button
                        type="submit"
                        disabled={verifyingOtp || otp.length < 6}
                        className={cn(
                          "w-full py-5 rounded-2xl font-black italic text-lg transition-all flex items-center justify-center gap-2",
                          (verifyingOtp || otp.length < 6)
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
                      onClick={handleSignUp}
                      disabled={loading}
                      className="w-full py-4 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Code"}
                    </button>

                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-sm font-bold text-purple-600 hover:text-purple-700"
                    >
                      Entered wrong email? Go back
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 group"
              >
                Sign in
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>

          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/demo"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
            >
              Or try the demo without signing up →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
