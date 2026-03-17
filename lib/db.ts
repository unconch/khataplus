import "server-only"
import { neon } from "@neondatabase/serverless"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

let prodSqlInstance: any = null
let demoSqlInstance: any = null

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 500

const sanitizeConnString = (url: string) => {
  if (!url) return url
  let sanitized = url.trim()
  if (sanitized.startsWith("psql '") && sanitized.endsWith("'")) {
    sanitized = sanitized.substring(6, sanitized.length - 1)
  } else if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
    sanitized = sanitized.substring(1, sanitized.length - 1)
  }
  return sanitized
}

const normalizeConnString = (url: string) => {
  const sanitized = sanitizeConnString(url)
  try {
    const parsed = new URL(sanitized)
    if (
      (parsed.protocol === "postgres:" || parsed.protocol === "postgresql:") &&
      parsed.searchParams.has("channel_binding")
    ) {
      // libpq option; not needed for Neon HTTP mode and can cause transport issues in some runtimes.
      parsed.searchParams.delete("channel_binding")
    }
    return parsed.toString()
  } catch {
    return sanitized
  }
}

const resetClient = (isGuest: boolean) => {
  if (isGuest) {
    demoSqlInstance = null
  } else {
    prodSqlInstance = null
  }
}

const getUrlHost = (url: string | null | undefined) => {
  if (!url) return "null"
  try {
    return new URL(normalizeConnString(url)).host
  } catch {
    return sanitizeConnString(url).split("@")[1] || "unknown"
  }
}

const getClient = (url: string, isGuest: boolean) => {
  const normalizedUrl = normalizeConnString(url)
  if (isGuest) {
    if (!demoSqlInstance) demoSqlInstance = neon(normalizedUrl)
    return demoSqlInstance
  }
  if (!prodSqlInstance) prodSqlInstance = neon(normalizedUrl)
  return prodSqlInstance
}

export function getProductionSql() {
  const connectionUrl = process.env.DATABASE_URL
  if (!connectionUrl) throw new Error("DATABASE_URL not set")
  return getClient(connectionUrl, false)
}

export const getSql = () => getProductionSql()

export function getDemoSql() {
  const connectionUrl = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionUrl) throw new Error("DEMO_DATABASE_URL or DATABASE_URL not set")
  return getClient(connectionUrl, true)
}

function normalizeRows(result: any): any[] {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.rows)) return result.rows
  return []
}

/**
 * Main SQL wrapper. Supports both tagged template usage and query-string usage.
 */
export const sql = async (
  stringsOrQuery: TemplateStringsArray | string,
  ...values: any[]
) => {
  let lastError: any = null
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    attempt++
    let connectionUrl = process.env.DATABASE_URL
    let isGuest = false

    try {
      const isEdge = process.env.NEXT_RUNTIME === "edge"
      if (!isEdge) {
        const { headers, cookies } = await import("next/headers")
        const headersList = await headers()
        const cookieStore = await cookies()

        const userId = cookieStore.get("userId")?.value || null
        const host = (headersList.get("x-forwarded-host") || headersList.get("host") || "").toLowerCase()
        const hostname = host.split(",")[0]?.trim().split(":")[0] || ""
        const isDemoHost = hostname === "demo.khataplus.online" || hostname.startsWith("demo.")
        if (
          (!userId && cookieStore.has("guest_mode")) ||
          headersList.get("x-guest-mode") === "true" ||
          isDemoHost
        ) {
          isGuest = true
          connectionUrl = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    } catch {
      // Ignore header/cookie extraction failures and proceed with defaults.
    }

    if (!connectionUrl) throw new Error("DATABASE_URL not set")
    const client = getClient(connectionUrl, isGuest)

    try {
      let queryText: string
      let queryParams: any[]

      if (typeof stringsOrQuery === "string") {
        queryText = stringsOrQuery
        queryParams = values.length === 1 && Array.isArray(values[0]) ? values[0] : values
      } else {
        queryText = stringsOrQuery.reduce(
          (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
          ""
        )
        queryParams = values
      }

      const result = await client.query(queryText, queryParams)
      return normalizeRows(result)
    } catch (dbErr: any) {
      lastError = dbErr
      const message = dbErr?.message || String(dbErr)
      const code = dbErr?.code || "UNKNOWN"

      if (code === "42P01" || /does not exist/i.test(message) || String(code).startsWith("23")) {
        throw dbErr
      }

      if (/fetch failed/i.test(message) && attempt < MAX_RETRIES) {
        resetClient(isGuest)
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.warn(
          `[DB/sql] Connection failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      const urlHost = getUrlHost(connectionUrl)
      console.error(
        `[DB/sql] Query Error code=${code} message=${message} host=${urlHost} guest=${isGuest}`
      )
      throw dbErr
    }
  }

  throw lastError
}

;(sql as any).query = async (query: string, params: any[] = []) => {
  return sql(query, params)
}

;(sql as any).unsafe = async (query: string, params: any[] = []) => {
  return sql(query, params)
}

export const getOrgBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (error) {
    throw new Error("Organization not found")
  }

  return data
})

export const getUserMembership = cache(
  async (userId: string, slug: string) => {
    const supabase = await createClient()

    const { data } = await supabase
      .from("organization_members")
      .select(`
      organization_id,
      role,
      organizations (
        id,
        slug
      )
    `)
      .eq("user_id", userId)
      .eq("organizations.slug", slug)
      .maybeSingle()

    return data
  }
)

export const resolveTenant = cache(
  async (userId: string | undefined | null, slug: string) => {
    if (slug === "demo") {
      return {
        orgId: "demo-org-id", // Standard ID for demo
        slug: "demo",
        role: "owner",
      }
    }
    
    if (!userId) return null
    const membership = await getUserMembership(userId, slug)

    if (!membership) return null

    return {
      orgId: membership.organization_id,
      slug,
      role: membership.role,
    }
  }
)
