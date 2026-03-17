import "server-only"
import { createClient } from "@/lib/supabase/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Profile } from "@/lib/types"

/**
 * Unified Session fetcher. Single source of truth for the current user.
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

/**
 * Resolves where a user should land after authentication.
 * Tie-breaker: Most recently accessed organization (last_active_at).
 */
export async function getRedirectPath(userId: string): Promise<string> {
  // 1. Check for most recently active organization
  const memberships = await sql`
    SELECT om.org_id, o.slug 
    FROM public.organization_members om
    JOIN public.organizations o ON om.org_id = o.id
    WHERE om.user_id = ${userId}
    ORDER BY om.last_active_at DESC NULLS LAST, o.created_at DESC
    LIMIT 1
  `

  if (memberships.length > 0) {
    return `/${memberships[0].slug}/dashboard`
  }

  // 2. Fallback to onboarding if no organization exists
  return "/onboarding"
}

/**
 * Caches and resolves tenant context (orgId, slug, role).
 * Uses a short-lived cookie for edge-compatible caching.
 */
export async function getTenantContext(slug: string, userId: string) {
  const cookieStore = await cookies()
  const cacheKey = `kp-tenant-${slug}`
  const cached = cookieStore.get(cacheKey)?.value

  if (cached) {
    try {
      const { orgId, role } = JSON.parse(cached)
      return { orgId, slug, role }
    } catch {
      // Malformed cache, proceeds to DB
    }
  }

  // DB Lookup
  const result = await sql`
    SELECT om.org_id, om.role
    FROM public.organization_members om
    JOIN public.organizations o ON om.org_id = o.id
    WHERE om.user_id = ${userId} AND o.slug = ${slug}
    LIMIT 1
  `

  if (result.length === 0) return null

  const context = { orgId: result[0].org_id, slug, role: result[0].role }

  // Cache it for 5 minutes (in-memory/cookie hybrid)
  // We set a cookie here which will be available on the next request
  // Note: setting a cookie in a server component/utility getter might throw depending on where it's called.
  // Middleware should ideally handle the persistent caching.
  
  return context
}

/**
 * Atomic Profile Sync. Ensures user exists in public.profiles.
 */
export async function ensureProfileSync(userId: string, email: string, name?: string) {
  try {
    const result = await sql`
      INSERT INTO public.profiles (id, email, name, role, is_fully_synced)
      VALUES (${userId}, ${email}, ${name || ""}, 'user', true)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
        updated_at = NOW()
      RETURNING *
    `
    return result[0] as Profile
  } catch (err) {
    console.error("Critical failure during profile sync:", err)
    throw new Error("Profile synchronization failed. Please try again.")
  }
}
