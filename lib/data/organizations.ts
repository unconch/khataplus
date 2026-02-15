"use server"

import { randomHex, generateUUID } from '../universal-crypto';

import { sql } from "../db";
import type { Organization, OrganizationMember, OrganizationInvite, SystemSettings } from "../types";
import { authorize, audit } from "../security";
import { cache } from "react";
import { unstable_cache as nextCache, revalidatePath, revalidateTag } from "next/cache";
import { sendWelcomeEmail } from "../mail";
import { getProfile } from "./profiles";


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
        console.log("[DB/Orgs] Inserting into organizations table...");
        const result = await sql`
            INSERT INTO organizations(name, slug, created_by, gstin, address, phone)
            VALUES(${name}, ${slug}, ${userId}, ${details?.gstin || null}, ${details?.address || null}, ${details?.phone || null})
            RETURNING *
        `;

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

        // Add creator as owner
        await sql`
            INSERT INTO organization_members(org_id, user_id, role)
            VALUES(${org.id}, ${userId}, 'owner')
        `;

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
                SELECT om.*, o.name as org_name, o.slug as org_slug, o.gstin as org_gstin, o.address as org_address, o.phone as org_phone
                FROM organization_members om
                JOIN organizations o ON om.org_id = o.id
                WHERE om.user_id = ${userId}
            `;
            return data.map((row: any) => ({
                ...row,
                organization: {
                    id: row.org_id,
                    name: row.org_name,
                    slug: row.org_slug,
                    gstin: row.org_gstin,
                    address: row.org_address,
                    phone: row.org_phone
                }
            })) as any;
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

export async function createInvite(orgId: string, email: string, role: string): Promise<OrganizationInvite> {
    const token = generateUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const result = await sql`
        INSERT INTO organization_invites(org_id, email, role, token, expires_at)
        VALUES(${orgId}, ${email}, ${role}, ${token}, ${expiresAt})
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
    // Verify that the accepting user's email matches the invited email
    const profile = await getProfile(userId);
    if (!profile || !profile.email || profile.email.toLowerCase() !== invite.email.toLowerCase()) {
        console.error(`[AcceptInvite] Hijack Attempt? Invited: ${invite.email}, Accepting: ${profile?.email}`);
        throw new Error("This invitation was sent to a different email address.");
    }

    await sql`
        INSERT INTO organization_members(org_id, user_id, role)
        VALUES(${invite.org_id}, ${userId}, ${invite.role})
    `;

    // Mark invite as accepted
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

export async function deleteOrganization(orgId: string): Promise<void> {
    await authorize("Delete Organization", "owner", orgId);

    // MISSION-CRITICAL: Crypto-shredding (ASVS Level 3)
    // Deleting the organization record also deletes the 'encrypted_dek'.
    // Any data in audit_logs or backups encrypted with this DEK becomes mathematically unrecoverable.
    await sql`DELETE FROM organizations WHERE id = ${orgId}`;

    await audit("Deleted Organization (Crypto-Shredded)", "organization", orgId, { orgId }, "system");

    revalidatePath("/", "layout");
}

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
