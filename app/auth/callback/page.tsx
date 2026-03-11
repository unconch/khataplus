import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getAppHostFromHostname } from "@/lib/auth-redirect"

async function getAppOrigin(): Promise<string> {
  const headerList = await headers()
  const forwardedHost = headerList.get("x-forwarded-host")
  const hostHeader = forwardedHost || headerList.get("host") || "app.khataplus.online"
  const firstHost = hostHeader.split(",")[0]?.trim() || "app.khataplus.online"
  const [hostname, port] = firstHost.split(":")
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname?.endsWith(".localhost")
  const protocol = headerList.get("x-forwarded-proto") || (isLocal ? "http" : "https")
  const appHost = getAppHostFromHostname(hostname || "app.khataplus.online")
  return `${protocol}://${appHost}${port ? `:${port}` : ""}`
}

export default async function AuthCallback() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organizations(slug)")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) {
    redirect("/setup-organization")
  }

  const slug = membership.organizations?.slug
  const appOrigin = await getAppOrigin()

  if (!slug) {
    redirect("/setup-organization")
  }

  redirect(`${appOrigin}/${slug}/dashboard`)
}
