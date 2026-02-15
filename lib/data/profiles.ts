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
            const { getProductionSql } = await import("../db");
            const db = getProductionSql();
            const data = await db`SELECT * FROM profiles ORDER BY created_at DESC`;
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


export const upsertProfile = async (profile: Profile): Promise<Profile> => {
    const result = await sql`
        INSERT INTO profiles(id, email, name, role, biometric_required, phone)
        VALUES(${profile.id}, ${profile.email}, ${profile.name || ""}, ${profile.role}, ${profile.biometric_required || false}, ${profile.phone || null})
        ON CONFLICT(id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            -- SECURITY: Prevent unauthorized role escalation via upsert
            -- Only update role if it's a new insert or if the caller is authorized
            biometric_required = EXCLUDED.biometric_required,
            phone = EXCLUDED.phone,
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


export async function updateUserRole(userId: string, role: string, orgId?: string): Promise<void> {
    await authorize("Update User Role", "admin", orgId);
    await sql`UPDATE profiles SET role = ${role}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
    await audit("Updated User Role", "profile", userId, { role }, orgId);
}

/**
 * Ensures user profile exists and is synced with Auth data.
 * Call this on each authenticated request or on sign-in.
 */
export async function ensureProfile(userId: string, email: string, name?: string, phone?: string): Promise<Profile> {
    console.log(`[ensureProfile] Checking profile for ${email} (ID: ${userId})`);

    let existing;
    try {
        existing = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
    } catch (dbErr: any) {
        console.error(`[ensureProfile] Initial lookup failed:`, dbErr);
        throw new Error(`Profile lookup failed: ${dbErr.message}`);
    }

    if (existing.length > 0) {
        console.log(`[ensureProfile] Found existing profile for ${email}`);
        // Update name or phone if changed
        const hasNameChanged = name && existing[0].name !== name;
        const hasPhoneChanged = phone && existing[0].phone !== phone;

        if (hasNameChanged || hasPhoneChanged) {
            console.log(`[ensureProfile] Updating details for ${email}`);
            await sql`
                UPDATE profiles 
                SET 
                    name = COALESCE(${name}, name), 
                    phone = COALESCE(${phone}, phone),
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ${userId}
            `;
            const updated = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
            return updated[0] as Profile;
        }
        return existing[0] as Profile;
    }

    console.log(`[ensureProfile] Profile not found by ID, checking by email: ${email}`);
    // Check by email for potential migration or duplicate account prevention
    let byEmail;
    try {
        byEmail = await sql`SELECT * FROM profiles WHERE email = ${email} LIMIT 1`;
    } catch (emailErr: any) {
        console.error(`[ensureProfile] Email lookup failed:`, emailErr);
        throw new Error(`Email lookup failed: ${emailErr.message}`);
    }

    if (byEmail.length > 0) {
        const oldId = byEmail[0].id;
        // If IDs don't match, we need to migrate the user's data to the new ID
        if (oldId !== userId) {
            console.log(`[ensureProfile] MIGRATION REQUIRED for ${email}: ${oldId} -> ${userId}`);

            try {
                // Strategy: Copy Profile -> Update References -> Delete Old Profile
                // 1. Create new profile with New ID and TEMP email (to avoid unique constraint)
                const p = byEmail[0];
                const tempEmail = `temp_${Date.now()}_${p.email}`;

                console.log(`[ensureProfile] Creating new profile record with temp email...`);
                await sql`
                    INSERT INTO profiles (id, email, name, phone, role, biometric_required, created_at, updated_at)
                    VALUES (${userId}, ${tempEmail}, ${name || p.name}, ${phone || p.phone}, ${p.role}, ${p.biometric_required}, ${p.created_at}, CURRENT_TIMESTAMP) 
                    ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                `;

                // 2. Update References in other tables
                console.log(`[ensureProfile] Updating foreign key references...`);

                const updateTable = async (table: string, userCol: string) => {
                    try {
                        console.log(`[ensureProfile] Migrating table: ${table}`);
                        await sql`UPDATE ${sql(table)} SET ${sql(userCol)} = ${userId} WHERE ${sql(userCol)} = ${oldId}`;
                    } catch (tErr: any) {
                        console.warn(`[ensureProfile] Failed to update table ${table}:`, tErr.message);
                        // We don't throw here to allow other tables to migrate
                    }
                };

                await updateTable('organization_members', 'user_id');
                await updateTable('organizations', 'created_by');
                await updateTable('audit_logs', 'user_id');
                await updateTable('sales', 'user_id');
                await updateTable('expenses', 'user_id');
                await updateTable('reports', 'created_by');

                // 3. Delete old profile
                console.log(`[ensureProfile] Deleting old profile record ${oldId}`);
                await sql`DELETE FROM profiles WHERE id = ${oldId}`;

                // 4. Restore correct email on new profile
                console.log(`[ensureProfile] Restoring production email...`);
                await sql`UPDATE profiles SET email = ${email} WHERE id = ${userId}`;

                // Fetch updated profile
                const updated = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
                const pUpdated = updated[0] as any;
                console.log(`[ensureProfile] Migration complete for ${email}`);
                return {
                    ...pUpdated,
                    created_at: pUpdated.created_at instanceof Date ? pUpdated.created_at.toISOString() : String(pUpdated.created_at),
                    updated_at: pUpdated.updated_at instanceof Date ? pUpdated.updated_at.toISOString() : String(pUpdated.updated_at),
                } as Profile;
            } catch (migErr: any) {
                console.error(`[ensureProfile] Migration FATAL error:`, migErr);
                throw new Error(`Migration failed: ${migErr.message}`);
            }
        }

        // Just update name/phone if IDs match
        console.log(`[ensureProfile] IDs match, updating details for ${email}`);
        await sql`
            UPDATE profiles 
            SET 
                name = COALESCE(${name}, name), 
                phone = COALESCE(${phone}, phone),
                updated_at = CURRENT_TIMESTAMP 
            WHERE email = ${email}
        `;
        const updated = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
        const p = updated[0] as any;
        return {
            ...p,
            created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
            updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
        } as Profile;
    }

    // Create new profile
    console.log(`[ensureProfile] Creating BRAND NEW profile for ${email}`);
    try {
        const result = await sql`
            INSERT INTO profiles (id, email, name, phone, role, biometric_required) 
            VALUES (${userId}, ${email}, ${name || ""}, ${phone || null}, 'staff', false)
            RETURNING *
        `;

        const p = result[0] as any;
        console.log(`[ensureProfile] New profile created successfully for ${email}`);
        return {
            ...p,
            created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
            updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
        } as Profile;
    } catch (createErr: any) {
        console.error(`[ensureProfile] Failed to create brand new profile:`, createErr);
        throw new Error(`Profile creation failed: ${createErr.message}`);
    }
}
