import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

type Props = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  return <div>{children}</div>
}
