import Link from "next/link"
import type { Metadata } from "next"
import { getSession } from "@/lib/session"
import { resolvePhoneBoxOrganizationsForCurrentUser } from "@/lib/data/phonebox"

export const metadata: Metadata = {
  title: "PhoneBox Login | KhataPlus",
  description: "A dedicated sign-in and connect page for PhoneBox users.",
}

type PhoneBoxLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSingle(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] || fallback
  return value || fallback
}

export default async function PhoneBoxLoginPage({ searchParams }: PhoneBoxLoginPageProps) {
  const params = (await searchParams) || {}
  const deviceName = readSingle(params.device_name, "Front Counter")
  const redirectUri = readSingle(params.redirect_uri, "phonebox://connect")
  const orgId = readSingle(params.org_id)

  const session = await getSession()
  const isAuthenticated = Boolean(session?.userId)
  const organizations = isAuthenticated ? await resolvePhoneBoxOrganizationsForCurrentUser() : []
  const selectedOrg = organizations.find((org) => org.id === orgId) || organizations[0] || null

  const connectQuery = new URLSearchParams()
  if (deviceName) connectQuery.set("device_name", deviceName)
  if (redirectUri) connectQuery.set("redirect_uri", redirectUri)
  if (selectedOrg?.id) connectQuery.set("org_id", selectedOrg.id)

  const continueHref = `/phonebox/connect?${connectQuery.toString()}`
  const loginHref = `/auth/login?next=${encodeURIComponent(`/auth/phonebox/login?${connectQuery.toString()}`)}`

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#d5f5e6_0%,#f7fafc_45%,#eef4ff_100%)] text-zinc-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
            PhoneBox by KhataPlus
          </p>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            Dedicated login for PhoneBox devices.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            This page is built specifically for counter devices using PhoneBox. Sign in, confirm the workspace, and hand the device back to the app securely.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="grid gap-5 sm:grid-cols-3">
              <FeatureCard title="Sign in" body="Authenticate with your normal KhataPlus account." />
              <FeatureCard title="Connect" body="Generate a one-time PhoneBox connect code for this device." />
              <FeatureCard title="Return" body="Send the device safely back into the PhoneBox app to finish setup." />
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Device setup</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoRow label="Device name" value={deviceName} />
                <InfoRow label="Return link" value={redirectUri} />
                <InfoRow label="Status" value={isAuthenticated ? "Signed in to KhataPlus" : "PhoneBox login required"} />
                <InfoRow
                  label="Workspace"
                  value={selectedOrg ? `${selectedOrg.name} (${selectedOrg.slug})` : isAuthenticated ? "Choose during connect" : "Available after login"}
                />
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-8 text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.55)]">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">PhoneBox auth</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">Use this page only for PhoneBox devices.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              This route is separate from the regular dashboard login so PhoneBox users get a cleaner device-first setup flow.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href={isAuthenticated ? continueHref : loginHref}
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-4 text-base font-black text-zinc-950 transition hover:bg-emerald-300"
              >
                {isAuthenticated ? "Continue to Connect PhoneBox" : "Sign In for PhoneBox"}
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-4 text-sm font-bold text-white/90 transition hover:bg-white/10"
              >
                Open regular KhataPlus login
              </Link>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              <p className="font-bold text-white">Flow</p>
              <ol className="mt-3 space-y-3 leading-6">
                <li>1. Login with your KhataPlus account.</li>
                <li>2. Confirm the organization for this PhoneBox device.</li>
                <li>3. KhataPlus redirects back to the Android app.</li>
                <li>4. PhoneBox exchanges the one-time code for a device token.</li>
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">{title}</p>
      <p className="mt-3 text-sm leading-7 text-zinc-600">{body}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  )
}
