"use client"

import { Descope } from "@descope/react-sdk"
import { useSession, useUser } from "@descope/react-sdk"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const { isAuthenticated, isSessionLoading } = useSession()

  useEffect(() => {
    if (isAuthenticated && !isSessionLoading) {
      router.replace("/")
    }
  }, [isAuthenticated, isSessionLoading, router])

  const benefits = [
    "GST-compliant invoicing",
    "Real-time inventory tracking",
    "Works offline on any device",
    "Khata (credit) management",
  ]

  return (
    <div className="min-h-svh w-full flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-400 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
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
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Join 1,000+ businesses
              </div>
              <h1 className="text-4xl xl:text-5xl font-black leading-tight">
                Start managing<br />
                <span className="text-purple-100">smarter today.</span>
              </h1>
            </motion.div>

            {/* Benefits List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-medium text-purple-50">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-purple-100/60"
          >
            © 2024 KhataPlus. All rights reserved.
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 relative">
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} className="text-purple-600" />
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
              Create your account
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Get started with KhataPlus in seconds
            </p>
          </div>

          {/* Clerk SignUp Component */}
          <div className="w-full rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-zinc-900">
            <Descope
              flowId="sign-up-or-in"
              onSuccess={(e) => {
                console.log("Logged in!", e.detail.user)
                router.push("/setup-organization")
              }}
              onError={(e) => console.log("Could not log in!", e)}
              theme={window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"}
            />
          </div>

          {/* Sign In Link */}
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
