"use server"

import { randomHex, generateUUID } from '../universal-crypto';

import { sql } from "../db";
import type { Organization, OrganizationMember, OrganizationInvite, SystemSettings } from "../types";
import { authorize, audit } from "../security";
import { cache } from "react";
import { unstable_cache as nextCache, revalidatePath, revalidateTag } from "next/cache";
import { sendWelcomeEmail, sendOrgDeletionRequestEmail, sendOrgDeletionRejectedEmail } from "../mail";
import { getProfile } from "./profiles";
import { initializeOrganizationSchema } from "./schema-init";

async function ensureOrganizationMembersRoleConstraintAllowsOwner(): Promise<void> {
    await sql`
        ALTER TABLE organization_members
        DROP CONSTRAINT IF EXISTS organization_members_role_check
    `;

    await sql`
        ALTER TABLE organization_members
        ADD CONSTRAINT organization_members_role_check
        CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text, 'owner'::text]))
    `;
}


export async function getTotalOrganizationCount(): Promise<number> {
    const result = await sql`SELECT count(*) FROM organizations`;
    return parseInt(result[0].count);
}

export async function createOrganization(name: string, userId: string, details?: { gstin?: string; address?: string; phone?: string }): Promise<Organization> {
    // Check for existing organization with the same name (case-insensitive)
    const existingName = await sql`SELECT id FROM organizations WHERE LOWER(name) = LOWER(${name})`;
    if (existingName.length > 0) {
        throw new Error(`An organization with the name "${name}" already exists.`);
    }

    let slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Handle potential slug collisions
    const existingSlug = await sql`SELECT slug FROM organizations WHERE slug = ${slug}`;
    if (existingSlug.length > 0) {
        const suffix = randomHex(4);
        slug = `${slug}-${suffix}`;
    }

    console.log("[DB/Orgs] Generated slug:", slug);

    try {
        // 2026 Monetization: Check for Pioneer Partner eligibility (first 1000 signups)
        const orgCountResult = await sql`SELECT count(*) FROM organizations`;
        const totalOrgs = parseInt(orgCountResult[0].count);
        const isEligibleForPioneer = totalOrgs < 1000;

        console.log("[DB/Orgs] Inserting into organizations table...", { isEligibleForPioneer });
        let result;
        try {
            result = await sql`
                INSERT INTO organizations(
                    name, 
                    slug, 
                    created_by, 
                    gstin, 
                    address, 
                    phone,
                    subscription_status,
                    trial_ends_at,
                    pioneer_status,
                    pioneer_joined_at
                )
                VALUES(
                    ${name}, 
                    ${slug}, 
                    ${userId}, 
                    ${details?.gstin || null}, 
                    ${details?.address || null}, 
                    ${details?.phone || null},
                    'trial',
                    NOW() + INTERVAL '30 days',
                    ${isEligibleForPioneer},
                    ${isEligibleForPioneer ? sql`NOW()` : null}
                )
                RETURNING *
            `;
        } catch (insertErr: any) {
            // Fallback: DB missing monetization/phone columns
            console.warn("[DB/Orgs] Full INSERT failed, trying minimal INSERT:", insertErr.message);
            result = await sql`
                INSERT INTO organizations(name, slug, created_by, gstin, address)
                VALUES(${name}, ${slug}, ${userId}, ${details?.gstin || null}, ${details?.address || null})
                RETURNING *
            `;
        }

        console.log("[DB/Orgs] result set:", result);
        const orgRaw = result[0] as any;

        if (!orgRaw) {
            console.error("[DB/Orgs] INSERT succeeded but returned no rows!");
            throw new Error("Failed to retrieve created organization data");
        }

        const org = {
            ...orgRaw,
            created_at: orgRaw.created_at instanceof Date ? orgRaw.created_at.toISOString() : String(orgRaw.created_at),
            updated_at: orgRaw.updated_at instanceof Date ? orgRaw.updated_at.toISOString() : String(orgRaw.updated_at),
        } as Organization;

        // Create Isolated Schema & Tables
        try {
            await initializeOrganizationSchema(org.id);
            console.log(`[DB/Orgs] Schema initialized for ${org.id}`);
        } catch (schemaErr) {
            console.error("[DB/Orgs] Critical Failure: Schema initialization failed", schemaErr);
            // We don't throw here if the main org record was created, 
            // but in a production refined flow, we might want to rollback org creation.
        }

        // Add creator as owner. Self-heal older DBs where the role check
        // constraint still excludes 'owner', then retry once.
        try {
            await sql`
                INSERT INTO organization_members(org_id, user_id, role)
                VALUES(${org.id}, ${userId}, 'owner')
            `;
        } catch (memberInsertErr: any) {
            const message = String(memberInsertErr?.message || "");
            if (!message.includes("organization_members_role_check")) {
                throw memberInsertErr;
            }

            console.warn("[DB/Orgs] organization_members role constraint is outdated. Applying hotfix and retrying insert.");
            try {
                await ensureOrganizationMembersRoleConstraintAllowsOwner();
            } catch (constraintErr: any) {
                throw new Error(
                    `Database schema is outdated for organization roles. Please run the role-constraint migration (organization_members_role_check): ${constraintErr?.message || "unknown error"}`
                );
            }

            await sql`
                INSERT INTO organization_members(org_id, user_id, role)
                VALUES(${org.id}, ${userId}, 'owner')
            `;
        }


        // Promote user to main admin in profiles table for consistent permissions
        await sql`
            UPDATE profiles SET role = 'owner' WHERE id = ${userId}
        `;

        // Revalidate paths to ensure layout and dashboard reflect new organization
        revalidatePath("/", "layout");
        revalidatePath("/setup-organization");
        revalidatePath("/dashboard");
        revalidatePath(`/${slug}/dashboard`);

        // Explicitly revalidate the slug cache tag and user organizations
        try {
            (revalidateTag as any)(`org-slug-${slug}`);
            (revalidateTag as any)(`user-orgs-${userId}`);
        } catch (e) {
            console.warn("revalidateTag failed, non-critical:", e);
        }

        // Fire-and-forget welcome email
        getProfile(userId).then(profile => {
            if (profile && profile.email) {
                sendWelcomeEmail(profile.email, profile.name || "User", org.name)
                    .catch(e => console.error("[DB/Orgs] Failed to send welcome email:", e));
            }
        });

        return org;
    } catch (error) {
        console.error("Database error in createOrganization:", error);
        throw error;
    }
}

export async function getUserOrganizations(userId: string): Promise<(OrganizationMember & { organization: Organization })[]> {
    const retries = 3;
    for (let i = 0; i < retries; i++) {
        try {
            const data = await sql`
                SELECT om.*, to_jsonb(o.*) as org_data
                FROM organization_members om
                JOIN organizations o ON om.org_id = o.id
                WHERE om.user_id = ${userId}
            `;
            return data.map((row: any) => {
                const o = typeof row.org_data === 'string' ? JSON.parse(row.org_data) : row.org_data;
                return {
                    ...row,
                    organization: {
                        ...o,
                        // Ensure monetization fields have safe defaults if missing
                        subscription_status: o.subscription_status ?? 'trial',
                        trial_ends_at: o.trial_ends_at ?? null,
                        plan_type: o.plan_type ?? 'free',
                        pioneer_status: o.pioneer_status ?? false,
                        whatsapp_addon_active: o.whatsapp_addon_active ?? false,
                        gst_addon_active: o.gst_addon_active ?? false,
                        inventory_pro_active: o.inventory_pro_active ?? false,
                        vernacular_pack_active: o.vernacular_pack_active ?? false,
                        ai_forecast_active: o.ai_forecast_active ?? false,
                        auto_reminders_enabled: o.auto_reminders_enabled ?? false,
                    }
                };
            }) as any;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error("getUserOrganizations failed after retries");
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    await authorize("Update Organization", "owner", orgId);

    await sql`
        UPDATE organizations
        SET 
            name = COALESCE(${updates.name}, name),
            gstin = COALESCE(${updates.gstin}, gstin),
            address = COALESCE(${updates.address}, address),
            phone = COALESCE(${updates.phone}, phone),
            upi_id = COALESCE(${updates.upi_id}, upi_id),
            whatsapp_addon_active = COALESCE(${updates.whatsapp_addon_active}, whatsapp_addon_active),
            auto_reminders_enabled = COALESCE(${updates.auto_reminders_enabled}, auto_reminders_enabled),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${orgId}
    `;

    await audit("Updated Organization", "organization", orgId, updates, orgId);
}

export const getOrganizationBySlug = cache(async (slug: string): Promise<Organization | null> => {
    return nextCache(
        async (): Promise<Organization | null> => {
            const { getProductionSql } = await import("../db");
            const db = getProductionSql();
            const result = await db`SELECT * FROM organizations WHERE slug = ${slug}`;
            return (result[0] as Organization) || null;
        },
        [`org-slug-${slug}`],
        { tags: [`org-slug-${slug}`] }
    )();
});

export async function getOrganization(orgId: string): Promise<Organization | null> {
    const result = await sql`SELECT * FROM organizations WHERE id = ${orgId}`;
    return (result[0] as Organization) || null;
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const data = await sql`
        SELECT om.*, p.name as user_name, p.email as user_email
        FROM organization_members om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.org_id = ${orgId}
    `;
    return data.map((row: any) => ({
        ...row,
        user: {
            name: row.user_name,
            email: row.user_email
        }
    })) as OrganizationMember[];

}

const OPEN_INVITE_PLACEHOLDER = "open-invite@khataplus.local"

export async function createInvite(orgId: string, email: string | null, role: string): Promise<OrganizationInvite> {
    const token = generateUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    const normalizedEmail = email?.trim() || OPEN_INVITE_PLACEHOLDER;

    const result = await sql`
        INSERT INTO organization_invites(org_id, email, role, token, expires_at)
        VALUES(${orgId}, ${normalizedEmail}, ${role}, ${token}, ${expiresAt})
        RETURNING *
    `;
    return result[0] as OrganizationInvite;
}

export async function getInviteByToken(token: string): Promise<OrganizationInvite | null> {
    const result = await sql`
        SELECT * FROM organization_invites
        WHERE token = ${token} AND accepted_at IS NULL AND expires_at > NOW()
    `;
    return (result[0] as OrganizationInvite) || null;
}

export async function acceptInvite(token: string, userId: string): Promise<boolean> {
    const invite = await getInviteByToken(token);
    if (!invite) return false;

    // SECURITY HARDENING: Prevent Invitation Hijacking
    // Verify that the accepting user's email matches the invited email (skip for open invites)
    const isOpenInvite = invite.email === OPEN_INVITE_PLACEHOLDER;
    if (!isOpenInvite) {
        const profile = await getProfile(userId);
        if (!profile || !profile.email || profile.email.toLowerCase() !== invite.email.toLowerCase()) {
            console.error(`[AcceptInvite] Hijack Attempt? Invited: ${invite.email}, Accepting: ${profile?.email}`);
            throw new Error("This invitation was sent to a different email address.");
        }
    }

    await sql`
        INSERT INTO organization_members(org_id, user_id, role)
        VALUES(${invite.org_id}, ${userId}, ${invite.role})
        ON CONFLICT (org_id, user_id) DO NOTHING
    `;

    // Mark invite as accepted (one-time use for all invites)
    await sql`UPDATE organization_invites SET accepted_at = NOW() WHERE id = ${invite.id}`;
    return true;
}

export async function updateMemberRole(orgId: string, userId: string, newRole: string): Promise<void> {
    await authorize("Update Role", "owner", orgId);

    await sql`
        UPDATE organization_members
        SET role = ${newRole}, updated_at = CURRENT_TIMESTAMP
        WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    // FORCED LOGOUT on Role Change (ASVS Level 3)
    try {
        const { revokeAllSessions } = await import("../session-governance");
        await revokeAllSessions(userId);
    } catch (err) {
        console.error("[OrgMembers] Session revocation failed:", err);
    }
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
    await authorize("Remove Member", "owner", orgId);
    await sql`DELETE FROM organization_members WHERE org_id = ${orgId} AND user_id = ${userId}`;
}

// Note: `deleteOrganization` has been replaced by a deletion-request workflow below.

export async function getSystemSettings(orgId?: string) {
    if (!orgId) {
        return {
            id: 'default',
            allow_staff_inventory: true,
            allow_staff_sales: true,
            allow_staff_reports: true,
            allow_staff_reports_entry_only: false,
            allow_staff_analytics: false,
            allow_staff_add_inventory: false,
            gst_enabled: true,
            gst_inclusive: false,
            updated_at: new Date().toISOString()
        } as SystemSettings;
    }

    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<SystemSettings> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const result = await db`SELECT settings, updated_at FROM organizations WHERE id = ${orgId}`;
            if (result.length === 0 || !result[0].settings) {
                return {
                    id: orgId,
                    allow_staff_inventory: true,
                    allow_staff_sales: true,
                    allow_staff_reports: true,
                    allow_staff_reports_entry_only: false,
                    allow_staff_analytics: false,
                    allow_staff_add_inventory: false,
                    gst_enabled: true,
                    gst_inclusive: false,
                    updated_at: new Date().toISOString()
                } as SystemSettings;
            }
            const s = result[0].settings;
            return {
                id: orgId,
                ...s,
                updated_at: result[0].updated_at instanceof Date ? result[0].updated_at.toISOString() : String(result[0].updated_at),
            } as SystemSettings;
        },
        [`org-settings-${flavor}-${orgId}`],
        { tags: ["settings", `settings-${orgId}`, `settings-${flavor}`], revalidate: 3600 }
    )();
}

export async function updateSystemSettings(updates: Partial<SystemSettings>, orgId?: string): Promise<void> {
    const { getCurrentOrgId } = await import("./auth");
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    await authorize("Update Settings", "owner", actualOrgId);

    await sql`
        UPDATE organizations
        SET settings = settings || ${JSON.stringify(updates)}::jsonb
        WHERE id = ${actualOrgId}
    `;

    await audit("Updated Settings", "settings", actualOrgId, updates, actualOrgId);
    (revalidateTag as any)(`settings-${actualOrgId}`);
    revalidatePath("/dashboard/admin", "page");
}


// ============================================================
// ADD THESE TO THE BOTTOM OF lib/data/organizations.ts
// Also add sendOrgDeletionEmail to lib/mail.ts (see Part 3)
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface DeletionRequestStatus {
    hasPendingRequest: boolean
    requestId?: string
    requestedBy?: string
    requestedAt?: string
    expiresAt?: string
    isExpired?: boolean
    approvals?: {
        ownerId: string
        ownerName: string
        approved: boolean | null
        respondedAt?: string
    }[]
    totalApproversNeeded?: number
    approvedCount?: number
    rejectedCount?: number
}

// ── Internal helper ──────────────────────────────────────────

async function expireStaleRequests(orgId: string): Promise<void> {
    await sql`
        UPDATE org_deletion_requests
        SET status = 'expired', updated_at = NOW()
        WHERE org_id = ${orgId}
        AND status = 'pending'
        AND expires_at < NOW()
    `
}

// ── Request deletion ─────────────────────────────────────────

export async function requestOrganizationDeletion(orgId: string): Promise<{
    requestId: string
    requiresApproval: boolean
    pendingOwners: number
    deleted: boolean
}> {
    // 1. Authorize - any owner can call, but only creator proceeds past next check
    const user = await authorize("Delete Organization", "owner", orgId)

    // 2. Verify org exists
    const orgRows = await sql`
        SELECT id, name, created_by FROM organizations WHERE id = ${orgId}
    `
    if (orgRows.length === 0) throw new Error("Organization not found")
    const org = orgRows[0]

    // 3. Only original creator can initiate
    if (org.created_by !== user.id) {
        throw new Error("Only the original creator of this organization can request deletion")
    }

    // 4. Expire stale requests first
    await expireStaleRequests(orgId)

    // 5. Check for existing active pending request
    const existing = await sql`
        SELECT id FROM org_deletion_requests
        WHERE org_id = ${orgId} AND status = 'pending'
    `
    if (existing.length > 0) {
        throw new Error("A deletion request is already pending. Check your settings page for status.")
    }

    // 6. Get ALL other owners (not the creator)
    const otherOwners = await sql`
        SELECT om.user_id, p.name, p.email
        FROM organization_members om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.org_id = ${orgId}
          AND om.role = 'owner'
          AND om.user_id != ${user.id}
          AND p.status = 'active'
    `

    // 7. Create the deletion request record
    const requestRows = await sql`
        INSERT INTO org_deletion_requests (org_id, requested_by, org_name, status, expires_at)
        VALUES (
            ${orgId},
            ${user.id},
            ${org.name},
            'pending',
            NOW() + INTERVAL '7 days'
        )
        RETURNING id
    `
    const requestId = requestRows[0].id

    // 8. No other owners — delete immediately
    if (otherOwners.length === 0) {
        await executeOrganizationDeletion(orgId, user.id, requestId, org.name)
        return { requestId, requiresApproval: false, pendingOwners: 0, deleted: true }
    }

    // 9. Create approval slots for each other owner
    for (const owner of otherOwners) {
        await sql`
            INSERT INTO org_deletion_approvals (request_id, owner_id, owner_name, owner_email, approved)
            VALUES (${requestId}, ${owner.user_id}, ${owner.name || "Unknown"}, ${owner.email}, NULL)
            ON CONFLICT (request_id, owner_id) DO NOTHING
        `
    }

    // 10. Notify all other owners via email (non-fatal)
    const requesterName = user.name || user.email || "Organization Creator"
    for (const owner of otherOwners) {
        sendOrgDeletionRequestEmail(
            owner.email,
            owner.name || "Owner",
            org.name,
            requesterName,
            requestId
        ).catch(e => console.warn(`[deleteOrg] Email to ${owner.email} failed:`, e))
    }

    await audit(
        "Requested Organization Deletion",
        "organization",
        orgId,
        { requestId, otherOwnerCount: otherOwners.length },
        orgId
    )

    return {
        requestId,
        requiresApproval: true,
        pendingOwners: otherOwners.length,
        deleted: false
    }
}

// ── Respond to deletion request (approve or reject) ──────────

export async function respondToOrganizationDeletion(
    requestId: string,
    approve: boolean
): Promise<{ deleted: boolean; pendingCount: number; rejectedBy?: string }> {
    // 1. Authorize - must be an owner somewhere
    const user = await authorize("Respond to Deletion Request", "owner")

    // 2. Load request with org validation
    const requestRows = await sql`
        SELECT odr.*, o.name as org_name
        FROM org_deletion_requests odr
        LEFT JOIN organizations o ON odr.org_id = o.id
        WHERE odr.id = ${requestId}
    `
    if (requestRows.length === 0) {
        throw new Error("Deletion request not found")
    }
    const req = requestRows[0]

    // 3. Check request is still valid
    if (req.status !== "pending") {
        throw new Error(`This deletion request is already ${req.status}`)
    }
    if (new Date(req.expires_at) < new Date()) {
        await sql`
            UPDATE org_deletion_requests SET status = 'expired', updated_at = NOW()
            WHERE id = ${requestId}
        `
        throw new Error("This deletion request has expired")
    }

    // 4. Verify this user is an approver for this request
    const approvalRows = await sql`
        SELECT id, approved FROM org_deletion_approvals
        WHERE request_id = ${requestId} AND owner_id = ${user.id}
    `
    if (approvalRows.length === 0) {
        throw new Error("You are not an approver for this deletion request")
    }
    if (approvalRows[0].approved !== null) {
        throw new Error("You have already responded to this deletion request")
    }

    // 5. Record response
    await sql`
        UPDATE org_deletion_approvals
        SET approved = ${approve}, responded_at = NOW()
        WHERE request_id = ${requestId} AND owner_id = ${user.id}
    `

    // 6. If rejected — cancel immediately, no need for others to respond
    if (!approve) {
        await sql`
            UPDATE org_deletion_requests
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = ${requestId}
        `

        // Notify requester of rejection (non-fatal)
        const requesterRows = await sql`
            SELECT p.email, p.name FROM profiles p
            JOIN org_deletion_requests odr ON odr.requested_by = p.id
            WHERE odr.id = ${requestId}
        `
        if (requesterRows.length > 0) {
            sendOrgDeletionRejectedEmail(
                requesterRows[0].email,
                requesterRows[0].name || "Owner",
                req.org_name || req.org_id,
                user.name || user.email || "An owner"
            ).catch(e => console.warn("[deleteOrg] Rejection email failed:", e))
        }

        await audit(
            "Rejected Organization Deletion Request",
            "organization",
            req.org_id,
            { requestId, rejectedBy: user.id },
            req.org_id
        )

        return { deleted: false, pendingCount: 0, rejectedBy: user.name || user.email }
    }

    // 7. Check if all approvers have approved
    const pendingRows = await sql`
        SELECT COUNT(*) as count
        FROM org_deletion_approvals
        WHERE request_id = ${requestId} AND approved IS NULL
    `
    const stillPending = parseInt(pendingRows[0].count)

    if (stillPending > 0) {
        return { deleted: false, pendingCount: stillPending }
    }

    // 8. All approved — execute deletion
    await executeOrganizationDeletion(req.org_id, req.requested_by, requestId, req.org_name)
    return { deleted: true, pendingCount: 0 }
}

// ── Cancel a pending deletion request ────────────────────────

export async function cancelOrganizationDeletion(orgId: string): Promise<void> {
    const user = await authorize("Cancel Organization Deletion", "owner", orgId)

    // Expire stale requests first
    await expireStaleRequests(orgId)

    const requestRows = await sql`
        SELECT id, requested_by FROM org_deletion_requests
        WHERE org_id = ${orgId} AND status = 'pending'
    `
    if (requestRows.length === 0) throw new Error("No pending deletion request found")

    const req = requestRows[0]

    // Only requester or org creator can cancel
    const orgRows = await sql`SELECT created_by FROM organizations WHERE id = ${orgId}`
    const isRequester = req.requested_by === user.id
    const isCreator = orgRows[0]?.created_by === user.id

    if (!isRequester && !isCreator) {
        throw new Error("Only the deletion requester or org creator can cancel")
    }

    await sql`
        UPDATE org_deletion_requests
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${req.id}
    `

    await audit("Cancelled Organization Deletion Request", "organization", orgId, { cancelledBy: user.id }, orgId)
}

// ── Get deletion request status ───────────────────────────────

export async function getDeletionRequestStatus(orgId: string): Promise<DeletionRequestStatus> {
    // Expire stale requests first (lightweight — runs every time status is checked)
    await expireStaleRequests(orgId)

    const requestRows = await sql`
        SELECT odr.*, p.name as requester_name, p.email as requester_email
        FROM org_deletion_requests odr
        JOIN profiles p ON odr.requested_by = p.id
        WHERE odr.org_id = ${orgId} AND odr.status = 'pending'
        ORDER BY odr.created_at DESC
        LIMIT 1
    `

    if (requestRows.length === 0) return { hasPendingRequest: false }

    const req = requestRows[0]

    const approvalRows = await sql`
        SELECT owner_id, owner_name, approved, responded_at
        FROM org_deletion_approvals
        WHERE request_id = ${req.id}
        ORDER BY created_at ASC
    `

    const approvals = approvalRows.map((a: any) => ({
        ownerId: a.owner_id,
        ownerName: a.owner_name,
        approved: a.approved,
        respondedAt: a.responded_at
    }))

    return {
        hasPendingRequest: true,
        requestId: req.id,
        requestedBy: req.requester_name || req.requester_email,
        requestedAt: req.created_at,
        expiresAt: req.expires_at,
        isExpired: new Date(req.expires_at) < new Date(),
        approvals,
        totalApproversNeeded: approvals.length,
        approvedCount: approvals.filter((a: any) => a.approved === true).length,
        rejectedCount: approvals.filter((a: any) => a.approved === false).length,
    }
}

// ── Core deletion executor (internal — not exported) ──────────

async function executeOrganizationDeletion(
    orgId: string,
    requestedByUserId: string,
    requestId: string,
    orgName: string
): Promise<void> {
    // 1. Mark request approved before doing anything (idempotency guard)
    await sql`
        UPDATE org_deletion_requests
        SET status = 'approved', updated_at = NOW()
        WHERE id = ${requestId} AND status = 'pending'
    `

    // 2. Crypto-shredding — delete DEK so all encrypted data becomes unrecoverable
    //    This must happen BEFORE deleting the org row (which holds encrypted_dek)
    try {
        // We intentionally do NOT call getTenantDEK here — we just null out the column
        // and let the org row deletion cascade handle the rest
        await sql`
            UPDATE organizations SET encrypted_dek = NULL WHERE id = ${orgId}
        `
        console.log(`[deleteOrg] Crypto-shredded DEK for org ${orgId}`)
    } catch (e) {
        console.warn("[deleteOrg] DEK shredding failed (non-fatal):", e)
    }

    // 3. Revoke all active sessions for all members
    try {
        const members = await sql`
            SELECT user_id FROM organization_members WHERE org_id = ${orgId}
        `
        const { revokeAllSessions } = await import("../session-governance")
        await Promise.allSettled(
            members.map((m: any) => revokeAllSessions(m.user_id))
        )
        console.log(`[deleteOrg] Revoked sessions for ${members.length} members`)
    } catch (e) {
        console.warn("[deleteOrg] Session revocation failed (non-fatal):", e)
    }

    // 4. Detach profiles that reference this org (prevent FK errors on profile reads)
    try {
        await sql`
            UPDATE profiles SET organization_id = NULL WHERE organization_id = ${orgId}
        `
    } catch (e) {
        console.warn("[deleteOrg] Profile detach failed (non-fatal):", e)
    }

    // 5. Delete the org — CASCADE handles all related tables automatically
    await sql`DELETE FROM organizations WHERE id = ${orgId}`

    // 6. Log to system (org is gone so no orgId context — use system)
    console.log(`[System] Organization "${orgName}" (${orgId}) permanently deleted by ${requestedByUserId}`)

    // 7. Revalidate layout cache
    revalidatePath("/", "layout")
    revalidatePath("/setup-organization")
}
