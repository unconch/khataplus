"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const redirectingRef = useRef(false)

  useEffect(() => {
    async function handleRedirect() {
      if (redirectingRef.current) return
      redirectingRef.current = true

      const { data: userRes } = await supabase.auth.getUser()
      if (!userRes?.user) {
        router.replace("/auth/login")
        return
      }

      const source = searchParams.get("source") || "login"
      const next = searchParams.get("next") || ""
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("/auth/") ? next : ""
      if (safeNext) {
        redirectToAppPath(safeNext)
        return
      }

      const slug = userRes.user.user_metadata?.active_org_slug

      if (typeof slug === "string" && slug.trim()) {
        router.refresh()
        redirectToAppPath(`/${slug.trim()}`)
        return
      }

      // Safety fallback: never leave user stuck if metadata is missing/stale.
      router.refresh()
      redirectToAppPath("/setup-org")
    }

    handleRedirect()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-svh w-full flex items-center justify-center p-8">
      <div className="text-sm text-zinc-500">Signing you in...</div>
    </div>
  )
}
