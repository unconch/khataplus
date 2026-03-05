"use client"

import { useEffect, useState } from "react"

const DEFAULT_DEMO_DASHBOARD_URL = "https://demo.khataplus.online/dashboard"

export function useDemoDashboardUrl() {
  const [demoUrl, setDemoUrl] = useState(DEFAULT_DEMO_DASHBOARD_URL)

  useEffect(() => {
    if (typeof window === "undefined") return

    const { protocol, hostname, port } = window.location
    const baseHostname = hostname.startsWith("demo.") ? hostname.slice(5) : hostname
    const demoHostname = `demo.${baseHostname}`
    const hostWithPort = port ? `${demoHostname}:${port}` : demoHostname
    setDemoUrl(`${protocol}//${hostWithPort}/dashboard`)
  }, [])

  return demoUrl
}
