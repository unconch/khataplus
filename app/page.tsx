import { redirect } from "next/navigation"
import { session } from "@descope/nextjs-sdk/server"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"


import { LandingPage } from "@/components/landing-page"

export default function Home() {
  return <LandingPage />
}
