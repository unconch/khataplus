"use server"

export async function isGuestMode() {
    const { cookies, headers } = await import("next/headers")
    const cookieStore = await cookies()
    const headerList = await headers()
    return cookieStore.has("guest_mode") || headerList.get("x-guest-mode") === "true"
}

export async function getCurrentUser(): Promise<{ userId: string, email: string, isGuest: boolean } | null> {
    // Prefer explicit guest/demo mode if the request indicates it.
    // This ensures visiting `/demo` forces the sandbox even when a
    // Supabase session is present in the browser (server-side sign-out
    // may not always clear client-side state immediately).
    if (await isGuestMode()) {
        return { userId: "guest-user", email: "guest@khataplus.demo", isGuest: true }
    }

    const { getSession } = await import("../session")
    const session = await getSession()
    const userId = session?.userId
    const email = session?.email || (userId ? `descope_${userId}@local.invalid` : undefined)

    if (userId && email) {
        return { userId, email: String(email), isGuest: false }
    }

    return null
}

export async function getCurrentOrgId(explicitUserId?: string): Promise<string | null> {
    let userId = explicitUserId;
    if (!userId) {
        const user = await getCurrentUser();
        userId = user?.userId;
    }

    if (await isGuestMode() || !userId || userId === "guest-user") return "demo-org";

    const orgs = await getUserOrganizationsResolved(userId);
    return orgs[0]?.org_id || null;
}

/**
 * Returns user org memberships with a DB-direct fallback when cached lookups are stale.
 */
export async function getUserOrganizationsResolved(userId: string): Promise<any[]> {
    const { getUserOrganizations } = await import("./organizations");
    const orgs = await getUserOrganizations(userId);
    if (orgs.length > 0) return orgs as any[];

    const { getProductionSql } = await import("../db");
    const db = getProductionSql();
    const rows = await db`
        SELECT om.id, om.org_id, om.user_id, om.role, om.created_at, to_jsonb(o.*) as org_data
        FROM organization_members om
        JOIN organizations o ON o.id = om.org_id
        WHERE om.user_id = ${userId}
        ORDER BY om.created_at ASC
    `;

    return rows.map((row: any) => ({
        id: row.id,
        org_id: row.org_id,
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        organization: typeof row.org_data === "string" ? JSON.parse(row.org_data) : row.org_data,
    }));
}
