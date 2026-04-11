import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck, Smartphone } from "lucide-react"

export const metadata: Metadata = {
  title: "KhataPlus Android Release Notes",
  description: "Release notes for the native KhataPlus Android app.",
  alternates: {
    canonical: "/android/release-notes",
  },
}

const apkUrl = "https://github.com/unconch/khataplus/releases/download/android-latest/khataplus-native-debug.apk"

const highlights = [
  "Native Kotlin + Jetpack Compose app, not a packaged web view.",
  "Smooth OTP sign-in and signup backed by the existing KhataPlus auth APIs.",
  "Persistent Android session handling with cookie-backed auth and logout support.",
  "Workspace screens for Sales, Inventory, Khata, Reports, and More.",
  "Responsive layout tuning for smaller Android phones and wider devices.",
]

const fixes = [
  "Removed the old web-wrapper approach for the Android experience.",
  "Fixed the auth state transitions so successful login/signup confirms the session before showing success.",
  "Cleaned up Unicode/currency rendering issues in the native UI.",
  "Improved the bottom navigation and commerce screens for narrow displays.",
  "Added a public web download page plus a stable APK release link.",
]

export default function AndroidReleaseNotesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_45%,#ffffff_100%)]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/android"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-900 shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to download
          </Link>
          <Link
            href={apkUrl}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-[0_18px_35px_-24px_rgba(5,150,105,0.45)] transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Smartphone className="h-4 w-4" />
            Download APK
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white bg-white/90 p-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4" />
            Native Android release notes
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
            What's inside the native KhataPlus Android build
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            This release focuses on a real Android-first experience for the KhataPlus app:
            faster sign-in, cleaner navigation, and a full native workspace for everyday business tasks.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-6">
              <div className="mb-4 flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="text-xl font-black">What's included</h2>
              </div>
              <ul className="space-y-3 text-emerald-950/85">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-sky-50 p-6">
              <div className="mb-4 flex items-center gap-2 text-sky-900">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-xl font-black">What changed</h2>
              </div>
              <ul className="space-y-3 text-sky-950/85">
                {fixes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-sky-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-zinc-50 p-5">
              <div className="text-sm font-bold text-zinc-900">Install</div>
              <div className="mt-2 text-sm text-zinc-700">Download the APK, open it on Android, and allow installs if prompted.</div>
            </div>
            <div className="rounded-3xl bg-zinc-50 p-5">
              <div className="text-sm font-bold text-zinc-900">Target</div>
              <div className="mt-2 text-sm text-zinc-700">Built for the `android` branch and published as `android-latest`.</div>
            </div>
            <div className="rounded-3xl bg-zinc-50 p-5">
              <div className="text-sm font-bold text-zinc-900">Support</div>
              <div className="mt-2 text-sm text-zinc-700">If something looks off, grab the latest APK again after the next branch push.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

