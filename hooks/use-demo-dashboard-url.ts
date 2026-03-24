"use client"

import { useEffect, useState } from "react"

const DEFAULT_DEMO_DASHBOARD_URL = "https://demo.khataplus.online/dashboard"

export function useDemoDashboardUrl() {
  const [demoUrl, setDemoUrl] = useState(DEFAULT_DEMO_DASHBOARD_URL)

  useEffect(() => {
    if (typeof window === "undefined") return

    const { protocol, hostname, port } = window.location
    const isLocalHost =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)

    if (isLocalHost) {
      const hostWithPort = port ? `${hostname}:${port}` : hostname
      setDemoUrl(`${protocol}//${hostWithPort}/demo`)
      return
    }

    const baseHostname = hostname.startsWith("demo.") ? hostname.slice(5) : hostname
    const demoHostname = `demo.${baseHostname}`
    const hostWithPort = port ? `${demoHostname}:${port}` : demoHostname
    setDemoUrl(`${protocol}//${hostWithPort}/dashboard`)
  }, [])

  return demoUrl
}
