import "server-only"
import { neon } from "@neondatabase/serverless"

let prodSqlInstance: any = null
let demoSqlInstance: any = null

const ISOLATED_TABLES = [
  "inventory",
  "sales",
  "expenses",
  "daily_reports",
  "audit_logs",
  "customers",
  "khata_transactions",
  "suppliers",
  "supplier_transactions",
]

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

const getClient = (url: string, isGuest: boolean) => {
  const sanitizedUrl = sanitizeConnString(url)
  if (isGuest) {
    if (!demoSqlInstance) demoSqlInstance = neon(sanitizedUrl)
    return demoSqlInstance
  }
  if (!prodSqlInstance) prodSqlInstance = neon(sanitizedUrl)
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

function toSchemaName(input: string): string {
  const normalized = input.replace(/-/g, "_")
  return normalized.startsWith("org_") ? normalized : `org_${normalized}`
}

function prefixIsolatedTables(query: string, schema: string): string {
  let rewritten = query
  for (const table of ISOLATED_TABLES) {
    const regex = new RegExp(`(?<!\\.)\\b${table}\\b`, "g")
    rewritten = rewritten.replace(regex, `"${schema}".${table}`)
  }
  return rewritten
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
    let targetSchema: string | null = null
    let isGuest = false

    try {
      const isEdge = process.env.NEXT_RUNTIME === "edge"
      if (!isEdge) {
        const { headers, cookies } = await import("next/headers")
        const headersList = await headers()
        const cookieStore = await cookies()

        const orgId = headersList.get("x-org-id")
        if (orgId) targetSchema = toSchemaName(orgId)

        const userId = cookieStore.get("userId")?.value || null
        const path = headersList.get("x-invoke-path") || ""
        if (
          (!userId && cookieStore.has("guest_mode")) ||
          path.startsWith("/demo") ||
          headersList.get("x-guest-mode") === "true"
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
      let baseQueryText: string
      let queryParams: any[]

      if (typeof stringsOrQuery === "string") {
        baseQueryText = stringsOrQuery
        queryText =
          targetSchema && !isGuest
            ? prefixIsolatedTables(baseQueryText, targetSchema)
            : baseQueryText
        queryParams =
          values.length === 1 && Array.isArray(values[0]) ? values[0] : values
      } else {
        baseQueryText = stringsOrQuery.reduce(
          (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
          ""
        )
        queryText =
          targetSchema && !isGuest
            ? prefixIsolatedTables(baseQueryText, targetSchema)
            : baseQueryText
        queryParams = values
      }

      try {
        const result = await client.query(queryText, queryParams)
        return normalizeRows(result)
      } catch (schemaErr: any) {
        const code = schemaErr?.code || ""
        const message = schemaErr?.message || String(schemaErr)
        const missingIsolatedRelation =
          !!targetSchema &&
          !isGuest &&
          code === "42P01" &&
          new RegExp(`relation\\s+\"${targetSchema}\\.`).test(message)

        if (missingIsolatedRelation) {
          const fallbackResult = await client.query(baseQueryText, queryParams)
          return normalizeRows(fallbackResult)
        }

        throw schemaErr
      }
    } catch (dbErr: any) {
      lastError = dbErr
      const message = dbErr?.message || String(dbErr)
      const code = dbErr?.code || "UNKNOWN"

      if (code === "42P01" || /does not exist/i.test(message) || String(code).startsWith("23")) {
        throw dbErr
      }

      if (/fetch failed/i.test(message) && attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.warn(
          `[DB/sql] Connection failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      const urlHost = connectionUrl ? connectionUrl.split("@")[1] : "null"
      console.error(
        `[DB/sql] Query Error code=${code} message=${message} host=${urlHost} guest=${isGuest}`
      )
      throw dbErr
    }
  }

  throw lastError
}

  ; (sql as any).withSchema = async (
    orgId: string,
    stringsOrQuery: TemplateStringsArray | string,
    ...values: any[]
  ) => {
    const schemaName = toSchemaName(orgId)
    const connectionUrl = process.env.DATABASE_URL
    if (!connectionUrl) throw new Error("DATABASE_URL not set")
    const client = getClient(connectionUrl, false)

    let queryText: string
    let queryParams: any[]

    if (typeof stringsOrQuery === "string") {
      queryText = prefixIsolatedTables(stringsOrQuery, schemaName)
      queryParams = values.length === 1 && Array.isArray(values[0]) ? values[0] : values
    } else {
      const rawQuery = stringsOrQuery.reduce(
        (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
        ""
      )
      queryText = prefixIsolatedTables(rawQuery, schemaName)
      queryParams = values
    }

    const result = await client.query(queryText, queryParams)
    return normalizeRows(result)
  }

  ; (sql as any).query = async (query: string, params: any[] = []) => {
    return sql(query, params)
  }

  ; (sql as any).unsafe = async (query: string, params: any[] = []) => {
    return sql(query, params)
  }

