import "server-only"

import { createHash, randomBytes } from "crypto"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getUserOrganizationsResolved } from "@/lib/data/auth"

type PhoneBoxOrganization = {
  id: string
  name: string
  slug: string
  role: string
  upiId?: string | null
}

type DeviceTokenRecord = {
  id: string
  user_id: string
  org_id: string
  device_name: string
  status: string
}

const CONNECT_CODE_TTL_MINUTES = 10

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex")
}

async function ensurePhoneBoxTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS phonebox_connect_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      code_hash TEXT NOT NULL UNIQUE,
      redirect_uri TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS phonebox_device_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      device_model TEXT NULL,
      app_version TEXT NULL,
      monitored_packages JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_seen_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS phonebox_payment_events (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      device_token_id TEXT NOT NULL,
      source_package TEXT NOT NULL,
      source_app_name TEXT NOT NULL,
      amount_paise BIGINT NOT NULL,
      payer_name TEXT NULL,
      note TEXT NULL,
      raw_text TEXT NOT NULL,
      transaction_ref TEXT NULL,
      detected_at BIGINT NOT NULL,
      dedupe_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_phonebox_connect_codes_user ON phonebox_connect_codes(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_phonebox_device_tokens_user ON phonebox_device_tokens(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_phonebox_device_tokens_org ON phonebox_device_tokens(org_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_phonebox_payment_events_org ON phonebox_payment_events(org_id, detected_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_phonebox_payment_events_device ON phonebox_payment_events(device_token_id, detected_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_phonebox_payment_events_dedupe ON phonebox_payment_events(org_id, dedupe_key)`
}

export async function resolvePhoneBoxBaseUrl() {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host") || "app.khataplus.in"
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`.replace(/\/$/, "")
}

export async function resolvePhoneBoxOrganizationsForCurrentUser(): Promise<PhoneBoxOrganization[]> {
  const session = await getSession()
  if (!session?.userId) return []

  const orgs = await getUserOrganizationsResolved(session.userId)
  return orgs
    .map((item: any) => {
      const org = item.organization || item
      const id = String(org?.id || item?.org_id || "").trim()
      const name = String(org?.name || item?.name || "").trim()
      const slug = String(org?.slug || item?.slug || "").trim()
      if (!id || !name || !slug) return null
      return {
        id,
        name,
        slug,
        role: String(item?.role || "staff"),
        upiId: org?.upi_id ?? org?.upiId ?? null,
      }
    })
    .filter(Boolean) as PhoneBoxOrganization[]
}

export async function createPhoneBoxConnectCode(input: {
  orgId?: string | null
  deviceName: string
  redirectUri: string
}) {
  await ensurePhoneBoxTables()

  const session = await getSession()
  if (!session?.userId) {
    throw new Error("UNAUTHORIZED")
  }

  const orgs = await resolvePhoneBoxOrganizationsForCurrentUser()
  if (orgs.length === 0) {
    throw new Error("NO_ORGANIZATION")
  }

  const selectedOrg = orgs.find((org) => org.id === input.orgId) || orgs[0]
  const rawCode = randomToken(24)
  const recordId = `pbc_${randomToken(8)}`
  const expiresAt = new Date(Date.now() + CONNECT_CODE_TTL_MINUTES * 60_000)

  await sql`
    INSERT INTO phonebox_connect_codes (
      id,
      user_id,
      org_id,
      device_name,
      code_hash,
      redirect_uri,
      expires_at
    )
    VALUES (
      ${recordId},
      ${session.userId},
      ${selectedOrg.id},
      ${input.deviceName.trim() || "Front Counter"},
      ${sha256(rawCode)},
      ${input.redirectUri},
      ${expiresAt.toISOString()}
    )
  `

  return {
    code: rawCode,
    organization: selectedOrg,
  }
}

export async function exchangePhoneBoxConnectCode(input: {
  code: string
  deviceName?: string | null
  deviceModel?: string | null
  appVersion?: string | null
}) {
  await ensurePhoneBoxTables()

  const codeHash = sha256(input.code.trim())
  const rows = await sql`
    SELECT id, user_id, org_id, device_name
    FROM phonebox_connect_codes
    WHERE code_hash = ${codeHash}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `

  const row = rows[0]
  if (!row) {
    throw new Error("INVALID_CODE")
  }

  await sql`
    UPDATE phonebox_connect_codes
    SET consumed_at = NOW()
    WHERE id = ${row.id}
  `

  const token = randomToken(32)
  const tokenId = `pbt_${randomToken(8)}`
  const deviceName = String(input.deviceName || row.device_name || "Front Counter").trim() || "Front Counter"

  await sql`
    INSERT INTO phonebox_device_tokens (
      id,
      user_id,
      org_id,
      device_name,
      token_hash,
      status,
      device_model,
      app_version,
      last_seen_at
    )
    VALUES (
      ${tokenId},
      ${row.user_id},
      ${row.org_id},
      ${deviceName},
      ${sha256(token)},
      'active',
      ${input.deviceModel?.trim() || null},
      ${input.appVersion?.trim() || null},
      NOW()
    )
  `

  const orgRows = await sql`
    SELECT o.id, o.name, o.slug, om.role
    FROM organizations o
    JOIN organization_members om ON om.org_id = o.id
    WHERE o.id = ${row.org_id}
      AND om.user_id = ${row.user_id}
    LIMIT 1
  `

  const org = orgRows[0]
  if (!org) {
    throw new Error("ORG_NOT_FOUND")
  }

  return {
    token,
    deviceId: tokenId,
    organization: {
      id: String(org.id),
      name: String(org.name || ""),
      slug: String(org.slug || ""),
      role: String(org.role || "staff"),
    },
  }
}

export async function requirePhoneBoxToken(request: Request): Promise<DeviceTokenRecord> {
  await ensurePhoneBoxTables()

  const auth = request.headers.get("authorization") || ""
  const match = auth.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  if (!token) {
    throw new Error("UNAUTHORIZED")
  }

  const rows = await sql`
    SELECT id, user_id, org_id, device_name, status
    FROM phonebox_device_tokens
    WHERE token_hash = ${sha256(token)}
    LIMIT 1
  `

  const row = rows[0] as DeviceTokenRecord | undefined
  if (!row || row.status !== "active") {
    throw new Error("UNAUTHORIZED")
  }

  await sql`
    UPDATE phonebox_device_tokens
    SET last_seen_at = NOW(), updated_at = NOW()
    WHERE id = ${row.id}
  `

  return row
}

export async function listPhoneBoxOrganizationsForToken(token: DeviceTokenRecord): Promise<PhoneBoxOrganization[]> {
  const orgs = await getUserOrganizationsResolved(token.user_id)
  return orgs
    .map((item: any) => {
      const org = item.organization || item
      const id = String(org?.id || item?.org_id || "").trim()
      const name = String(org?.name || item?.name || "").trim()
      const slug = String(org?.slug || item?.slug || "").trim()
      if (!id || !name || !slug) return null
      return {
        id,
        name,
        slug,
        role: String(item?.role || "staff"),
        upiId: org?.upi_id ?? org?.upiId ?? null,
      }
    })
    .filter(Boolean) as PhoneBoxOrganization[]
}

export async function listPhoneBoxMembers(orgId: string, userId: string) {
  const membership = await sql`
    SELECT 1
    FROM organization_members
    WHERE org_id = ${orgId}
      AND user_id = ${userId}
    LIMIT 1
  `
  if (!membership[0]) {
    throw new Error("FORBIDDEN")
  }

  const rows = await sql`
    SELECT
      om.org_id,
      om.user_id,
      om.role,
      p.name,
      p.email
    FROM organization_members om
    LEFT JOIN profiles p ON p.id = om.user_id
    WHERE om.org_id = ${orgId}
    ORDER BY om.role, p.name, p.email
  `

  return rows.map((row: any) => ({
    orgId: String(row.org_id),
    userId: String(row.user_id),
    role: String(row.role || "staff"),
    name: row.name ? String(row.name) : null,
    email: row.email ? String(row.email) : null,
  }))
}

export async function registerPhoneBoxDevice(
  token: DeviceTokenRecord,
  input: {
    deviceName: string
    deviceModel?: string | null
    appVersion?: string | null
    organizationId?: string | null
    monitoredPackages?: string[]
  }
) {
  const targetOrgId = input.organizationId?.trim() || token.org_id
  await sql`
    UPDATE phonebox_device_tokens
    SET
      device_name = ${input.deviceName.trim() || token.device_name},
      org_id = ${targetOrgId},
      device_model = ${input.deviceModel?.trim() || null},
      app_version = ${input.appVersion?.trim() || null},
      monitored_packages = ${JSON.stringify(input.monitoredPackages || [])}::jsonb,
      updated_at = NOW(),
      last_seen_at = NOW()
    WHERE id = ${token.id}
  `

  return {
    deviceId: token.id,
    status: "active",
  }
}

export async function syncPhoneBoxPaymentEvents(
  token: DeviceTokenRecord,
  events: Array<{
    eventId: string
    orgId?: string | null
    sourcePackage: string
    sourceAppName: string
    amountPaise: number
    payerName?: string | null
    note?: string | null
    rawText: string
    transactionRef?: string | null
    detectedAt: number
    dedupeKey: string
  }>
) {
  await ensurePhoneBoxTables()

  const acceptedIds: string[] = []
  const rejectedIds: string[] = []

  for (const event of events) {
    try {
      const orgId = String(event.orgId || token.org_id || "").trim()
      if (!orgId) {
        rejectedIds.push(event.eventId)
        continue
      }

      await sql`
        INSERT INTO phonebox_payment_events (
          id,
          org_id,
          device_token_id,
          source_package,
          source_app_name,
          amount_paise,
          payer_name,
          note,
          raw_text,
          transaction_ref,
          detected_at,
          dedupe_key
        )
        VALUES (
          ${event.eventId},
          ${orgId},
          ${token.id},
          ${event.sourcePackage},
          ${event.sourceAppName},
          ${event.amountPaise},
          ${event.payerName?.trim() || null},
          ${event.note?.trim() || null},
          ${event.rawText},
          ${event.transactionRef?.trim() || null},
          ${event.detectedAt},
          ${event.dedupeKey}
        )
        ON CONFLICT (id) DO NOTHING
      `
      acceptedIds.push(event.eventId)
    } catch {
      rejectedIds.push(event.eventId)
    }
  }

  return {
    acceptedIds,
    rejectedIds,
    message: `Accepted ${acceptedIds.length} event(s).`,
  }
}
