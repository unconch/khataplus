"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/ui/logo"
import { ArrowRight, ShieldCheck, Zap, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Script from "next/script"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { getUserOrganizations } = await import("@/lib/data/organizations")
        const userOrgs = await getUserOrganizations(session.user.id).catch(() => [])

        if (userOrgs && userOrgs.length > 0) {
          router.replace(`/${userOrgs[0].organization.slug}/dashboard`)
        } else {
          router.replace("/setup-organization")
        }
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      let { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        console.warn("[GIS] Supabase returned error, checking session fallback...", error);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("[GIS] Session found despite error, proceeding.");
          data = { user: session.user, session } as any;
          error = null;
        }
      }

      if (error) throw error;

      if (data?.user) {
        try {
          const [{ ensureProfile, getUserOrganizations }] = await Promise.all([
            import("@/lib/data"),
          ]);

          const [userOrgs] = await Promise.all([
            getUserOrganizations(data.user.id),
            ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.full_name).catch(e => console.error("Sync error:", e))
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
      if (err.message?.includes("unexpected response")) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/setup-organization");
          return;
        }
      }
      toast.error(err.message || "Google login failed. Please try again.");
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

      const buttonDiv = document.getElementById("google-button-login");
      if (buttonDiv) {
        google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with",
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Welcome back!")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { getUserOrganizations } = await import("@/lib/data/organizations")
        const userOrgs = await getUserOrganizations(user.id)

        if (userOrgs && userOrgs.length > 0) {
          router.push(`/${userOrgs[0].organization.slug}/dashboard`)
          return
        }
      }
    } catch (e) {
      console.error("Failed to resolve org for redirect:", e)
    }

    router.push("/setup-organization")
  }

  return (
    <div className="min-h-svh w-full flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-0" />
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-violet-600/20 rounded-full blur-[120px] animate-orbit" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[120px] animate-orbit-slow" />
        </div>
        <div className="absolute inset-0 opacity-[0.03] z-1" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />

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
                Welcome<br />
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
            <p className="text-sm text-white/40 font-medium">© 2026 KhataPlus Online. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
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

          {/* Login Form */}
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
              <label className="text-sm font-medium dark:text-zinc-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm pr-11"
                  placeholder="•••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="relative mt-16 mb-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              <span className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 px-3 py-1 rounded-full shadow-sm">
                Instant Login
              </span>
            </div>
          </div>

          {/* Google Login Button Container */}
          <div className="w-full relative py-2 flex justify-center">
            <div className="relative w-full flex justify-center items-center">
              <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={handleGoogleLoad}
                strategy="afterInteractive"
              />
              <div id="google-button-login" className="w-full min-h-[44px] flex justify-center items-center py-2" />
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 flex items-center justify-center rounded-xl z-20">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                </div>
              )}
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 group"
              >
                Create one
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>

          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/demo"
              className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
            >
              Or try the demo without signing up →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
