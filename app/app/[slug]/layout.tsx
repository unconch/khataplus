import Layout from "@/app/(app)/layout"
import type { ReactNode } from "react"

export default function SlugLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>
}
