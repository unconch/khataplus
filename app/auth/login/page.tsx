"use client"

import { Descope } from "@descope/react-sdk"
import { useSession, useUser } from "@descope/react-sdk"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isSessionLoading } = useSession()

  useEffect(() => {
    if (isAuthenticated && !isSessionLoading) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isSessionLoading, router])

  return (
    <div className="min-h-svh w-full flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Logo size={40} className="text-white" />
              </motion.div>
              <span className="font-bold text-2xl tracking-tight">KhataPlus</span>
            </Link>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl xl:text-5xl font-black leading-tight">
                Run your business,<br />
                <span className="text-emerald-100">not your paperwork.</span>
              </h1>
              <p className="mt-4 text-lg text-emerald-100/80 max-w-md">
                Join thousands of Indian businesses managing their inventory, sales, and finances with ease.
              </p>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                GST Compliant
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                <Zap className="h-4 w-4" />
                Offline Ready
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-emerald-100/60"
          >
            © 2024 KhataPlus. All rights reserved.
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 relative">
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} className="text-emerald-600" />
            <span className="font-bold text-xl text-zinc-900 dark:text-white">KhataPlus</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Authentication Component */}
          <div className="w-full rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-zinc-900">
            <Descope
              flowId="sign-up-or-in"
              onSuccess={(e) => {
                console.log("Logged in!", e.detail.user)
                router.push("/dashboard")
              }}
              onError={(e) => console.log("Could not log in!", e)}
              theme={typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"}
            />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
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

          {/* Demo Link */}
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
