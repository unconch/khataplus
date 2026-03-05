import Link from "next/link"
import { ShieldCheck, KeyRound, Database, FileLock2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

const pillars = [
  {
    title: "Encrypted Data",
    description: "Data is encrypted in transit and protected at rest."
  },
  {
    title: "Access Control",
    description: "Role-based permissions help restrict who can view or change sensitive data."
  },
  {
    title: "Session Security",
    description: "Active session controls and account protection reduce unauthorized access."
  },
  {
    title: "Audit Trails",
    description: "Important actions are logged so teams can review activity when needed."
  }
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-emerald-500/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={32} className="text-emerald-600" />
            <span className="font-bold text-xl tracking-tight text-zinc-900">KhataPlus</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-zinc-100 rounded-full px-4 text-zinc-600">
              <ArrowLeft size={16} /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <section className="max-w-5xl mx-auto">
          <div className="mb-12">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Security</h1>
            <p className="text-zinc-600 text-lg max-w-3xl">
              KhataPlus is built with practical security controls to protect your business data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <article className="rounded-3xl border border-zinc-200 p-6 bg-zinc-50/70">
              <div className="flex items-center gap-3 mb-3 text-zinc-900">
                <KeyRound size={20} />
                <h2 className="text-xl font-bold">Authentication</h2>
              </div>
              <p className="text-zinc-600">Secure login flows, OTP verification, and protected sessions.</p>
            </article>

            <article className="rounded-3xl border border-zinc-200 p-6 bg-zinc-50/70">
              <div className="flex items-center gap-3 mb-3 text-zinc-900">
                <Database size={20} />
                <h2 className="text-xl font-bold">Data Protection</h2>
              </div>
              <p className="text-zinc-600">Business records are stored with safeguards and controlled access.</p>
            </article>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-3xl border border-zinc-200 p-6 bg-white">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{pillar.title}</h3>
                <p className="text-zinc-600">{pillar.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-zinc-200 p-6 md:p-8 bg-emerald-50/50">
            <div className="flex items-center gap-3 mb-3 text-emerald-700">
              <FileLock2 size={20} />
              <h2 className="text-xl font-bold">Need Security Details?</h2>
            </div>
            <p className="text-zinc-700 mb-5">
              For security-related questions, contact our team at support@khataplus.online.
            </p>
            <a href="mailto:support@khataplus.online">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Contact Security Team
              </Button>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
