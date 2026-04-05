"use client"

import Link from "next/link"
import { ArrowRight, HeartHandshake, Landmark, MapPinned, Phone, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

const navItems = [
  { href: "#issues", label: "Issues" },
  { href: "#constituency", label: "Guwahati Central" },
  { href: "#join", label: "Join Project Ax" },
  { href: "#contact", label: "Contact" },
]

const priorities = [
  {
    title: "Drainage and flood readiness",
    assamese: "নলা-নর্দমা, জলাবদ্ধতা, আৰু সময়মতে পৰিষ্কাৰ",
    detail:
      "Ward-level drainage mapping, desilting calendars, and public progress boards for the monsoon season.",
  },
  {
    title: "Traffic and safer streets",
    assamese: "ট্ৰাফিক নিয়ন্ত্ৰণ, পথবাতি, আৰু সুৰক্ষিত পথচলা",
    detail:
      "Smarter junction management, safer crossings, and better lighting for commuters, students, and working families.",
  },
  {
    title: "Water, waste, and basic services",
    assamese: "বিশুদ্ধ পানী, বর্জ্য ব্যৱস্থাপনা, আৰু মৌলিক নাগৰিক সেৱা",
    detail:
      "Regular service tracking for water supply, garbage collection, and neighborhood complaint resolution.",
  },
  {
    title: "Jobs and local business support",
    assamese: "স্থানীয় ব্যৱসায়, যুৱকৰ চাকৰি, আৰু বাজারৰ উন্নয়ন",
    detail:
      "Support for markets, small traders, and youth-facing skill opportunities tied to real city demand.",
  },
]

const constituencyFacts = [
  "36-Guwahati Central is part of the Guwahati parliamentary segment after delimitation.",
  "The constituency campaign must speak to dense urban neighborhoods, traders, renters, students, and working families.",
  "Project Ax is framed around service delivery, accountability, and visible local action rather than personality attacks.",
]

const actionTracks = [
  {
    icon: MapPinned,
    title: "Local problem mapping",
    copy:
      "Document recurring waterlogging points, traffic bottlenecks, and broken civic infrastructure with location-based follow-up.",
  },
  {
    icon: ShieldCheck,
    title: "Public accountability",
    copy:
      "Publish issue trackers, meeting notes, and timelines so residents can measure what gets promised and what gets done.",
  },
  {
    icon: Users,
    title: "Volunteer network",
    copy:
      "Build a ward-by-ward volunteer system for outreach, issue collection, polling-day support, and multilingual communication.",
  },
]

const ctaCards = [
  {
    icon: HeartHandshake,
    title: "Volunteer with Project Ax",
    copy: "Join booth outreach, community listening drives, design support, and field coordination.",
    action: "Become a volunteer",
  },
  {
    icon: Landmark,
    title: "Support transparent campaigning",
    copy: "Back a factual, issue-first campaign focused on Guwahati Central and everyday civic delivery.",
    action: "Support Project Ax",
  },
  {
    icon: Phone,
    title: "Report a local issue",
    copy: "Share a flooding point, waste problem, traffic risk, or service breakdown from your locality.",
    action: "Send an update",
  },
]

export function CampaignDemo() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7db_0%,_#fff5e8_32%,_#f5f2ea_68%,_#efe8d8_100%)] text-stone-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[#ffb347]/25 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-[#165b33]/18 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-[20rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#d68c45]/18 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-[#fff9ef]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#165b33,#f19a3e)] text-sm font-black uppercase tracking-[0.35em] text-white shadow-[0_12px_30px_rgba(22,91,51,0.25)]">
              Ax
            </div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-stone-500">Project Ax</p>
              <p className="text-sm font-semibold text-stone-900">Guwahati Central Demo</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-stone-700 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-stone-950">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              className="rounded-full bg-stone-900 px-5 text-white hover:bg-stone-800"
            >
              <Link href="#join">Join Project Ax</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:pb-20 lg:pt-16">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-[#165b33]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#165b33] shadow-sm">
            Project Ax | Assamese + English campaign demo
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-500">Guwahati Central</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.04em] text-stone-950 sm:text-6xl xl:text-7xl">
              Project Ax for a cleaner, safer, and more accountable Guwahati Central.
            </h1>
            <p className="max-w-3xl text-xl font-medium leading-8 text-stone-700">
              প্ৰজেক্ট Ax গুৱাহাটী চেণ্ট্ৰেলৰ বাবে এক তথ্যভিত্তিক, সমস্যা-কেন্দ্ৰিক, আৰু দায়িত্বশীল গণঅভিযানৰ নমুনা।
            </p>
            <p className="max-w-3xl text-lg leading-8 text-stone-600">
              This demo focuses on civic delivery, neighborhood priorities, and public accountability. It avoids rumor,
              identity attacks, and unverifiable claims.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[linear-gradient(135deg,#165b33,#1f7a45)] px-6 text-white shadow-[0_18px_40px_rgba(22,91,51,0.25)] hover:opacity-95"
            >
              <Link href="#join">
                Volunteer for Project Ax
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-stone-300 bg-white/80 px-6 text-stone-900 hover:bg-white"
            >
              <Link href="#issues">See the local agenda</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { value: "36", label: "Constituency number" },
              { value: "4", label: "Core issue tracks" },
              { value: "2", label: "Languages only: Assamese, English" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_rgba(53,38,19,0.08)] backdrop-blur">
                <p className="text-3xl font-black tracking-[-0.05em] text-stone-950">{stat.value}</p>
                <p className="mt-2 text-sm text-stone-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-x-8 top-8 -z-10 h-full rounded-[2rem] bg-[linear-gradient(180deg,rgba(241,154,62,0.28),rgba(22,91,51,0.16))] blur-2xl" />
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,230,0.82))] p-6 shadow-[0_26px_80px_rgba(53,38,19,0.14)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Project Ax Brief</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-stone-950">What the campaign stands for</h2>
              </div>
              <div className="rounded-full bg-[#165b33]/10 px-3 py-1 text-xs font-semibold text-[#165b33]">Issue-first</div>
            </div>

            <div className="mt-6 space-y-4">
              {actionTracks.map((track) => {
                const Icon = track.icon

                return (
                  <div key={track.title} className="rounded-[1.5rem] border border-stone-200/70 bg-white/80 p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-2xl bg-stone-900 p-3 text-white">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-stone-950">{track.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-stone-600">{track.copy}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-stone-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/65">Assamese line</p>
              <p className="mt-3 text-lg font-semibold leading-8">
                গুৱাহাটী চেণ্ট্ৰেলক উন্নত কৰিবলৈ প্রতিশ্রুতি নহয়, দৃশ্যমান কাম, সময়সীমা, আৰু জবাবদিহি লাগে।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="issues" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Priority issues</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-stone-950 sm:text-4xl">
              Project Ax keeps the campaign grounded in city problems people actually live with.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-stone-600">
            Each issue block combines a public complaint pattern, a local action path, and a measurable accountability
            promise.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {priorities.map((item, index) => (
            <article
              key={item.title}
              className="group rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(53,38,19,0.08)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                  0{index + 1}
                </span>
                <span className="rounded-full bg-[#f19a3e]/15 px-3 py-1 text-xs font-semibold text-[#8a4f17]">Local agenda</span>
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-stone-950">{item.title}</h3>
              <p className="mt-3 text-base font-medium leading-7 text-[#165b33]">{item.assamese}</p>
              <p className="mt-4 text-sm leading-7 text-stone-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="constituency" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-[linear-gradient(160deg,#165b33,#103b22)] p-8 text-white shadow-[0_28px_80px_rgba(16,59,34,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Constituency snapshot</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Guwahati Central needs an urban civic playbook.</h2>
            <p className="mt-5 text-base leading-8 text-white/82">
              Dense localities, commercial activity, commuter pressure, monsoon stress, and service delivery gaps make
              this a constituency where visible governance matters every week, not just during election season.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Focus</p>
                <p className="mt-3 text-xl font-bold">Neighborhood accountability</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Approach</p>
                <p className="mt-3 text-xl font-bold">Evidence over rhetoric</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_22px_70px_rgba(53,38,19,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">Why this framing works</p>
            <div className="mt-6 space-y-4">
              {constituencyFacts.map((fact) => (
                <div key={fact} className="flex gap-4 rounded-[1.5rem] border border-stone-200/70 bg-[#fffaf1] p-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-[#f19a3e]" />
                  <p className="text-sm leading-7 text-stone-700">{fact}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Assamese note</p>
              <p className="mt-3 text-base leading-8 text-stone-700">
                এই ডেম'টোৱে ব্যক্তি-আক্ৰমণ নহয়, স্থানীয় সমস্যাৰ সমাধান, নাগৰিক সুৰক্ষা, আৰু ক্ষেত্ৰভিত্তিক জবাবদিহিক
                মুখ্য স্থান দিয়ে।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.25rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,246,226,0.92))] p-8 shadow-[0_28px_80px_rgba(53,38,19,0.1)]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">Take part</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-stone-950 sm:text-4xl">
              Project Ax turns supporters into local problem-solvers.
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-600">
              The demo below shows how a campaign can guide volunteers, supporters, and residents into specific,
              transparent actions without slipping into inflammatory politics.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {ctaCards.map((card) => {
              const Icon = card.icon

              return (
                <div key={card.title} className="rounded-[1.75rem] border border-stone-200/70 bg-white/80 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-stone-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{card.copy}</p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-5 rounded-full border-stone-300 bg-transparent px-5 text-stone-900 hover:bg-stone-100"
                  >
                    <Link href="#contact">{card.action}</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-7 shadow-[0_20px_60px_rgba(53,38,19,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Contact flow</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-stone-950">Project Ax contact points</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-stone-700">
              <p>
                <span className="font-semibold text-stone-950">Email:</span> projectax.demo@local.example
              </p>
              <p>
                <span className="font-semibold text-stone-950">Phone:</span> +91 00000 00000
              </p>
              <p>
                <span className="font-semibold text-stone-950">Office demo line:</span> GS Road, Guwahati Central
              </p>
            </div>
            <p className="mt-6 rounded-[1.5rem] bg-[#fff7e8] p-4 text-sm leading-7 text-stone-700">
              Assamese support line: স্বেচ্ছাসেৱক, স্থানীয় সমস্যা, আৰু জনসংযোগৰ বাবে Project Ax টীমৰ সৈতে যোগাযোগ কৰক।
            </p>
          </div>

          <div className="rounded-[2rem] bg-stone-950 p-7 text-white shadow-[0_28px_90px_rgba(28,20,11,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">Demo footer note</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Built for factual campaigning.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/78">
              Project Ax is presented here as a design and messaging demo for a civic, issue-first campaign website.
              The page intentionally excludes Hindi, identity targeting, communal framing, and unverified allegations.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-6 text-stone-950 hover:bg-white/90"
              >
                <Link href="#join">Join Project Ax</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
              >
                <Link href="#issues">Review issue agenda</Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className="mt-8 flex flex-col gap-3 border-t border-stone-900/10 pt-6 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Project Ax | Guwahati Central campaign demo | Assamese and English only</p>
          <p>Designed for factual, issue-first civic messaging.</p>
        </footer>
      </section>
    </main>
  )
}

export default CampaignDemo
