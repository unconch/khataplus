import type { Metadata } from "next"
import Link from "next/link"
import { ArrowDownToLine, BadgeInfo, Smartphone } from "lucide-react"

export const metadata: Metadata = {
  title: "Download KhataPlus Android",
  description: "Download the native KhataPlus Android APK from the web page.",
  alternates: {
    canonical: "/android",
  },
}

const apkUrl = "https://github.com/unconch/khataplus/releases/download/android-latest/khataplus-native-debug.apk"
const releaseUrl = "https://github.com/unconch/khataplus/releases/tag/android-latest"

export default function AndroidDownloadPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#dcfce7_0%,#eff6ff_48%,#ffffff_100%)]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
            <Smartphone className="h-4 w-4" />
            Native Android app
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
            Download KhataPlus Android from the web.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
            This page points to the latest native APK published from the `android` branch.
            Install it directly on your Android phone or tablet.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href={apkUrl}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-zinc-950 px-8 py-4 text-base font-black text-white shadow-[0_18px_35px_-22px_rgba(15,23,42,0.5)] transition-transform hover:scale-[1.02] active:scale-95"
            >
              <ArrowDownToLine className="h-5 w-5" />
              Download APK
            </a>
            <Link
              href={releaseUrl}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white px-8 py-4 text-base font-black text-zinc-900 transition-transform hover:scale-[1.02] active:scale-95"
            >
              <BadgeInfo className="h-5 w-5" />
              View release notes
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 p-5">
              <div className="text-sm font-bold text-emerald-900">Stable link</div>
              <div className="mt-2 text-sm text-emerald-900/80">Always points to the latest `android-latest` release.</div>
            </div>
            <div className="rounded-3xl bg-sky-50 p-5">
              <div className="text-sm font-bold text-sky-900">Native build</div>
              <div className="mt-2 text-sm text-sky-900/80">Kotlin + Jetpack Compose, not a web wrapper.</div>
            </div>
            <div className="rounded-3xl bg-amber-50 p-5">
              <div className="text-sm font-bold text-amber-900">Safe install</div>
              <div className="mt-2 text-sm text-amber-900/80">Enable installs from your browser or file manager if Android asks.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
