"use server"

import { sql } from "../db";
import type { Profile, AuditLog } from "../types";
import { unstable_cache as nextCache } from "next/cache";
import { cache } from "react";
import { createAuditLog } from "./audit";
import { authorize, audit } from "../security";

export async function getProfiles() {
    return nextCache(
        async (): Promise<Profile[]> => {
            const data = await sql`SELECT * FROM profiles ORDER BY created_at DESC`;
            return data.map((p: any) => ({
                ...p,
                created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
                updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
            })) as Profile[];
        },
        ["profiles-list"],
        { tags: ["profiles"] }
    )();
}

export async function getPendingApprovalsCount() {
    return nextCache(
        async (): Promise<number> => {
            const result = await sql`SELECT COUNT(*) as count FROM profiles WHERE status = 'pending'`;
            return parseInt(result[0]?.count || "0");
        },
        ["pending-approvals-count"],
        { tags: ["profiles"], revalidate: 60 }
    )();
}

export const upsertProfile = async (profile: Profile): Promise<Profile> => {
    const result = await sql`
        INSERT INTO profiles(id, email, name, role, status, biometric_required)
        VALUES(${profile.id}, ${profile.email}, ${profile.name || ""}, ${profile.role}, ${profile.status}, ${profile.biometric_required || false})
        ON CONFLICT(id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            biometric_required = EXCLUDED.biometric_required,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;

    return result[0] as any;
};

const getProfileRaw = cache(async (id: string) => {
    const result = await sql`SELECT * FROM profiles WHERE id = ${id}`;
    if (result.length === 0) {
        return null;
    }
    const p = result[0] as any;
    return {
        ...p,
        created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
        updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
    } as Profile;
});

export async function getProfile(id: string) {
    return getProfileRaw(id);
}

export async function updateProfileBiometricStatus(id: string, required: boolean, adminId: string): Promise<void> {
    const target = await getProfile(id);
    await sql`
        UPDATE profiles 
        SET biometric_required = ${required}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
    `;

    await createAuditLog({
        user_id: adminId,
        action: `Biometric Lock ${required ? 'Enabled' : 'Disabled'}`,
        entity_type: 'profile',
        entity_id: id,
        details: { target_email: target?.email },
        org_id: 'system'
    });
}

export async function updateUserStatus(userId: string, status: string, orgId?: string): Promise<void> {
    await authorize("Update User Status", "admin", orgId);
    await sql`UPDATE profiles SET status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
    await audit("Updated User Status", "profile", userId, { status }, orgId);
}

export async function updateUserRole(userId: string, role: string, orgId?: string): Promise<void> {
    await authorize("Update User Role", "admin", orgId);
    await sql`UPDATE profiles SET role = ${role}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
    await audit("Updated User Role", "profile", userId, { role }, orgId);
}

/**
 * Ensures user profile exists and is synced with Auth data.
 * Call this on each authenticated request or on sign-in.
 */
export async function ensureProfile(userId: string, email: string, name?: string): Promise<Profile> {
    const existing = await sql`SELECT * FROM profiles WHERE id = ${userId}`;

    if (existing.length > 0) {
        // Update name if changed
        if (name && existing[0].name !== name) {
            await sql`UPDATE profiles SET name = ${name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
            const updated = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
            return updated[0] as Profile;
        }
        return existing[0] as Profile;
    }

    // Check by email for potential migration or duplicate account prevention
    const byEmail = await sql`SELECT * FROM profiles WHERE email = ${email} LIMIT 1`;
    if (byEmail.length > 0) {
        // Update ID to new Descope ID (if it was different for some reason)
        await sql`UPDATE profiles SET id = ${userId}, name = ${name || byEmail[0].name}, updated_at = CURRENT_TIMESTAMP WHERE email = ${email}`;
        const updated = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
        return updated[0] as Profile;
    }

    // Create new profile
    const result = await sql`
        INSERT INTO profiles (id, email, name, role, status, biometric_required) 
        VALUES (${userId}, ${email}, ${name || ""}, 'admin', 'pending', false)
        RETURNING *
    `;

    return result[0] as Profile;
}
