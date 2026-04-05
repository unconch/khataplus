import { redirect } from "next/navigation"

type PhoneBoxRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

export default async function PhoneBoxPageRedirect({ searchParams }: PhoneBoxRedirectPageProps) {
  const params = (await searchParams) || {}
  const query = new URLSearchParams()

  const deviceName = readSingle(params.device_name)
  const redirectUri = readSingle(params.redirect_uri)
  const orgId = readSingle(params.org_id)

  if (deviceName) query.set("device_name", deviceName)
  if (redirectUri) query.set("redirect_uri", redirectUri)
  if (orgId) query.set("org_id", orgId)

  redirect(`/auth/phonebox/login${query.toString() ? `?${query.toString()}` : ""}`)
}
