"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function getAppHostFromCurrentHost(hostname: string): string {
  if (!hostname) return "app.khataplus.online"
  if (hostname === "localhost" || hostname === "127.0.0.1") return hostname
  if (hostname.endsWith(".localhost")) return hostname
  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)
  return `app.${base}`
}

function redirectToAppPath(target: string) {
  if (typeof window === "undefined") return
  const { protocol, hostname, port } = window.location
  const appHost = getAppHostFromCurrentHost(hostname)
  const portPart = port ? `:${port}` : ""
  const needsAppHost = hostname !== appHost
  const url = needsAppHost ? `${protocol}//${appHost}${portPart}${target}` : target
  window.location.assign(url)
}

export default function SetupOrgGate() {
  const router = useRouter()
  const supabase = createClient()
  const redirectingRef = useRef(false)

  useEffect(() => {
    async function waitForSession() {
      for (let i = 0; i < 6; i += 1) {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) return data.session
        await new Promise((r) => setTimeout(r, 200))
      }
      return null
    }

    async function run() {
      if (redirectingRef.current) return
      redirectingRef.current = true

      const session = await waitForSession()
      const user = session?.user

      if (!user) {
        router.replace("/auth/login")
        return
      }

      const slug = user.user_metadata?.active_org_slug
      if (typeof slug === "string" && slug.trim()) {
        redirectToAppPath(`/${slug.trim()}/dashboard`)
        return
      }

      router.replace("/setup-organization")
    }

    run()
  }, [router, supabase])

  return (
    <div className="min-h-svh w-full flex items-center justify-center p-8">
      <div className="text-sm text-zinc-500">Preparing your workspace...</div>
    </div>
  )
}
