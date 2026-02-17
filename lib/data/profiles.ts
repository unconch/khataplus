"use server"

import { sql } from "../db";
import type { Profile, AuditLog } from "../types";
import { unstable_cache as nextCache } from "next/cache";
import { cache } from "react";
import { createAuditLog } from "./audit";
import { authorize, audit } from "../security";
import { supabaseAdmin } from "../supabase/admin";

async function syncToAuth(userId: string, data: { name?: string | null, phone?: string | null, role?: string }, retries = 3): Promise<boolean> {
    try {
        console.log(`[syncToAuth] Syncing profile ${userId} to Supabase Auth (Remaining retries: ${retries})...`);
        const updates: any = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.role !== undefined) updates.role = data.role;

        if (Object.keys(updates).length === 0) return true;

        if (!supabaseAdmin) {
            console.warn("[syncToAuth] Supabase Admin not initialized. Skipping auth sync.");
            return false;
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: updates
        });

        if (error) {
            console.error(`[syncToAuth] Failed to sync to auth:`, error);
            if (retries > 0) {
                console.log(`[syncToAuth] Retrying in 1s...`);
                await new Promise(r => setTimeout(r, 1000));
                return syncToAuth(userId, data, retries - 1);
            }
            return false;
        }

        console.log(`[syncToAuth] Successfully synced to auth.`);
        return true;
    } catch (err) {
        console.error(`[syncToAuth] Unexpected error:`, err);
        return false;
    }
}

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
    let result;
    try {
        result = await sql`
            INSERT INTO profiles(id, email, name, role, biometric_required, phone)
            VALUES(${profile.id}, ${profile.email}, ${profile.name || ""}, ${profile.role}, ${profile.biometric_required || false}, ${profile.phone || null})
            ON CONFLICT(id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                biometric_required = EXCLUDED.biometric_required,
                phone = EXCLUDED.phone,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
    } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('phone')) {
            result = await sql`
                INSERT INTO profiles(id, email, name, role, biometric_required)
                VALUES(${profile.id}, ${profile.email}, ${profile.name || ""}, ${profile.role}, ${profile.biometric_required || false})
                ON CONFLICT(id) DO UPDATE SET
                    email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    biometric_required = EXCLUDED.biometric_required,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `;
        } else { throw err; }
    }

    /* 
       Reliable auth sync.
       We await this to ensure consistency before returning to UI.
    */
    await syncToAuth(profile.id, {
        name: profile.name,
        phone: profile.phone,
        role: profile.role
    });

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

    // Reliable Auth Sync
    await syncToAuth(userId, { role });
}

/**
 * Ensures user profile exists and is synced with Auth data.
 * Call this on each authenticated request or on sign-in.
 */
export async function ensureProfile(userId: string, email: string, name?: string, phone?: string, referrerCode?: string): Promise<Profile> {
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
            try {
                await sql`
                    UPDATE profiles 
                    SET 
                        name = COALESCE(${name}, name), 
                        phone = COALESCE(${phone}, phone),
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ${userId}
                `;
            } catch (updateErr: any) {
                if (updateErr.message?.includes('column') && updateErr.message?.includes('phone')) {
                    await sql`UPDATE profiles SET name = COALESCE(${name}, name), updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
                } else throw updateErr;
            }
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
                try {
                    await sql`
                        INSERT INTO profiles (id, email, name, phone, role, biometric_required, created_at, updated_at)
                        VALUES (${userId}, ${tempEmail}, ${name || p.name}, ${phone || p.phone}, ${p.role}, ${p.biometric_required}, ${p.created_at}, CURRENT_TIMESTAMP) 
                        ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                    `;
                } catch (colErr: any) {
                    if (colErr.message?.includes('column') && colErr.message?.includes('phone')) {
                        await sql`
                            INSERT INTO profiles (id, email, name, role, biometric_required, created_at, updated_at)
                            VALUES (${userId}, ${tempEmail}, ${name || p.name}, ${p.role}, ${p.biometric_required}, ${p.created_at}, CURRENT_TIMESTAMP)
                            ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                        `;
                    } else throw colErr;
                }

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

                // Sync the migrated profile to auth
                await syncToAuth(userId, {
                    name: name || p.name,
                    phone: phone || p.phone,
                    role: p.role
                });

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
        try {
            await sql`
                UPDATE profiles 
                SET 
                    name = COALESCE(${name}, name), 
                    phone = COALESCE(${phone}, phone),
                    updated_at = CURRENT_TIMESTAMP 
                WHERE email = ${email}
            `;
        } catch (updateErr: any) {
            if (updateErr.message?.includes('column') && updateErr.message?.includes('phone')) {
                await sql`UPDATE profiles SET name = COALESCE(${name}, name), updated_at = CURRENT_TIMESTAMP WHERE email = ${email}`;
            } else throw updateErr;
        }

        // Sync to auth if needed
        if (name || phone) {
            await syncToAuth(userId, { name: name || undefined, phone: phone || undefined });
        }

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
        // Generate a random referral code for the new user
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        let result;
        try {
            result = await sql`
                INSERT INTO profiles (id, email, name, phone, role, biometric_required, referral_code) 
                VALUES (${userId}, ${email}, ${name || ""}, ${phone || null}, 'staff', false, ${referralCode})
                RETURNING *
            `;
        } catch (colErr: any) {
            if (colErr.message?.includes('column')) {
                result = await sql`
                    INSERT INTO profiles (id, email, name, role, biometric_required)
                    VALUES (${userId}, ${email}, ${name || ""}, 'staff', false)
                    RETURNING *
                `;
            } else throw colErr;
        }

        if (referrerCode) {
            await trackReferral(referrerCode, userId).catch(err => {
                console.error("[ensureProfile] Failed to track referral:", err);
            });
        }

        // Sync initial data
        await syncToAuth(userId, {
            name: name || undefined,
            phone: phone || undefined,
            role: 'staff' // Default role
        });

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

/**
 * Tracks a referral and applies rewards if rules exist.
 */
async function trackReferral(referrerCode: string, referredId: string) {
    const referrerResult = await sql`SELECT id, organization_id FROM profiles WHERE referral_code = ${referrerCode}`;
    if (referrerResult.length === 0) return;

    const referrerId = referrerResult[0].id;
    const referrerOrgId = referrerResult[0].organization_id;

    // Avoid self-referral
    if (referrerId === referredId) return;

    await sql`
        INSERT INTO referrals (referrer_id, referred_id, status)
        VALUES (${referrerId}, ${referredId}, 'successful')
        ON CONFLICT (referred_id) DO NOTHING
    `;

    await sql`
        UPDATE profiles 
        SET referred_by = ${referrerId} 
        WHERE id = ${referredId} AND referred_by IS NULL
    `;

    // Trigger Reward Distribution
    if (referrerOrgId) {
        await applyReferralReward(referrerId, referrerOrgId).catch(err => {
            console.error("[trackReferral] Failed to apply reward:", err);
        });
    }
}

/**
 * Applies rewards to a referrer based on active referral rules.
 */
async function applyReferralReward(referrerId: string, orgId: string) {
    // 1. Get active rules
    const rules = await sql`SELECT * FROM referral_rules WHERE is_active = true`;
    if (rules.length === 0) return;

    for (const rule of rules) {
        if (rule.reward_type === 'plan_extension') {
            const days = rule.reward_days || 30;
            console.log(`[ReferralBonus] Granting ${days} days of ${rule.plan_type} to Org ${orgId}`);

            // Update Organization Subscription
            await sql`
                UPDATE organizations 
                SET 
                    plan_type = ${rule.plan_type},
                    plan_expires_at = COALESCE(plan_expires_at, NOW()) + (INTERVAL '1 day' * ${days}),
                    subscription_status = 'active',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${orgId}
            `;

            // Mark referral as rewarded
            await sql`
                UPDATE referrals 
                SET status = 'rewarded', reward_granted = true, updated_at = CURRENT_TIMESTAMP
                WHERE referrer_id = ${referrerId} AND status = 'successful'
            `;

            await audit("Applied Referral Reward", "organization", orgId, { bonus_days: days, rule_id: rule.id }, orgId);
        }
    }
}
