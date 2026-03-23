import { Navbar } from "@/components/landing-page/Navbar"
import { SiteFooter } from "@/components/landing-page/SiteFooter"
import { SolutionsSection } from "@/components/landing-page/SolutionsSection"
import { getCurrentUser } from "@/lib/data/auth"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default async function SolutionsPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null

  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }

  let orgSlug: string | null = null
  if (user && !user.isGuest) {
    try {
      const { getUserOrganizations } = await import("@/lib/data/organizations")
      const orgs = await getUserOrganizations(user.userId)
      orgSlug = orgs[0]?.organization?.slug || null
    } catch {
      orgSlug = null
    }
  }

  return (
    <main className="min-h-screen bg-white selection:bg-emerald-100 overflow-x-hidden font-sans text-zinc-900">
      <Navbar
        isAuthenticated={!!user}
        lightMode={true}
        orgSlug={orgSlug}
        isGuest={user?.isGuest}
        forcePublicActions={true}
      />

      {/* Sarvam.ai White Theme Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white border-b border-zinc-100">
        {/* Minimal Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:32px_32px]" />

        {/* Ambient Vibrant Gradients (Sarvam style) */}
        <div className="absolute top-[-20%] left-[20%] w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)] blur-[100px] rounded-full point-events-none" />
        <div className="absolute top-[20%] right-[-20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_60%)] blur-[100px] rounded-full point-events-none" />


        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <AdvancedScrollReveal variant="slideUp">
              <div className="flex flex-col items-start text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200 shadow-sm mb-8">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-800">Industry Specific Tools</span>
                </div>

                <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black tracking-[-0.03em] leading-[1] text-zinc-950 mb-8 max-w-4xl">
                  Tailored for your <br className="hidden md:block" />
                  unique <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">business needs.</span>
                </h1>

                <p className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed max-w-3xl mb-12 tracking-tight">
                  Whether you are managing a bustling pharmacy or a high-volume hardware store, KhataPlus adapts to your workflow, ensuring precision and ease.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={user ? (orgSlug ? `/${orgSlug}/dashboard` : "/dashboard") : "/auth/sign-up"}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-zinc-950 px-10 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-zinc-900 hover:-translate-y-1 active:translate-y-0 group"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </AdvancedScrollReveal>
          </div>
        </div>
      </section>

      <div>
        <SolutionsSection isFullPage={true} />
      </div>
      <SiteFooter />
    </main>
  )
}
