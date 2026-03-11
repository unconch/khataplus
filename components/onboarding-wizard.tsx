"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    async function checkOrg() {
      const res = await fetch("/api/organizations")
      const orgs = await res.json()

      if (orgs?.length > 0) {
        router.replace(`/${orgs[0].slug}/dashboard`)
      }
    }

    checkOrg()
  }, [router])

  return <div>Loading onboarding...</div>
}