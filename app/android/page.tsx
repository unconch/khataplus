import type { Metadata } from "next"
import Link from "next/link"
import { ArrowDownToLine, ChevronDown, Smartphone } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { androidApkUrl, androidReleaseEntries, latestAndroidRelease } from "./release-data"

export const metadata: Metadata = {
  title: "Download KhataPlus Android",
  description: "Download the native KhataPlus Android APK.",
  alternates: {
    canonical: "/android",
  },
}

export default function AndroidDownloadPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbfbf8_0%,#f9fafb_42%,#eef2ff_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_86%_22%,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_62%_82%,rgba(139,92,246,0.12),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/60 to-transparent" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 md:px-12 md:py-12">
        <header className="flex items-center justify-start gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/85 px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm backdrop-blur"
          >
            <Logo size={28} />
            <span className="hidden sm:inline">KhataPlus</span>
          </Link>
        </header>

        <div className="mx-auto mt-8 w-full max-w-6xl rounded-[2rem] border border-white/80 bg-white/86 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:mt-16 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-50 to-sky-50 px-4 py-2 text-sm font-semibold text-slate-700">
                <Smartphone className="h-4 w-4" />
                Native Android build
              </div>

              <div className="mt-7 space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
                  Download KhataPlus Android.
                </h1>
                <p className="max-w-4xl text-base leading-7 text-zinc-600 md:text-lg">
                  Download the newest native APK built from the android branch.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Direct
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-700">Stable APK link</div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                    Native
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-700">Compose app shell</div>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                    FastLoad
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-700">Jump to Sales</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 self-stretch">
              <div className="relative overflow-hidden rounded-[1.85rem] border border-zinc-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98),rgba(239,246,255,0.92))] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  Latest release
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="text-4xl font-semibold tracking-tight text-zinc-950">
                {latestAndroidRelease.version}
              </div>
                <div className="pb-1 text-sm text-zinc-500">{latestAndroidRelease.date}</div>
              </div>
                <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-600">
                  The current APK is ready to install and matches the newest native Android build.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-zinc-700">
                  <span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                    Native APK
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                    FastLoad ready
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                    Stable download
                  </span>
                </div>
              </div>

              <div className="rounded-[1.85rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  What&apos;s included
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                  <p>Native login and signup in the Android app.</p>
                  <p>Release notes live below in expandable cards.</p>
                  <p>The download button always points to the latest APK.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href={androidApkUrl}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25"
            >
              <ArrowDownToLine className="h-5 w-5" />
              Download APK
            </a>
          </div>
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Latest version {latestAndroidRelease.version} - {latestAndroidRelease.date}
          </p>
        </div>

        <section className="mx-auto mt-6 w-full max-w-6xl pb-10 md:mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Versions
            </h2>
            <p className="text-sm text-zinc-500">Tap a card to see what changed.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {androidReleaseEntries.map((entry, index) => (
              <details
                key={entry.version}
                className="group rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur open:shadow-md lg:min-h-[220px]"
                {...(index === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${entry.accent}`}>
                      Version {entry.version}
                    </div>
                    <div className="text-lg font-semibold text-zinc-950">{entry.summary}</div>
                    <div className="text-sm text-zinc-500">{entry.date}</div>
                  </div>
                  <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="mt-5 border-t border-zinc-100 pt-5">
                  <ul className="space-y-3 text-sm leading-6 text-zinc-600">
                    {entry.notes.map((note) => (
                      <li key={note} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
