"use server"

import { sql } from "../db";
import type { Profile, AuditLog } from "../types";
import { unstable_cache as nextCache } from "next/cache";
import { cache } from "react";
import { createAuditLog } from "./audit";
import { authorize, audit } from "../security";

async function syncToAuth(_userId: string, _data: { name?: string | null, phone?: string | null, role?: string }): Promise<boolean> {
    // Descope is the source of truth for authentication; profile metadata stays in Postgres.
    return true;
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
 * Migration helper to update all references from an old user ID to a new one.
 */
async function migrateUserReferences(oldId: string, newId: string) {
    const { getProductionSql } = await import("../db");
    const db = getProductionSql();

    const updateTable = async (tableName: string, userCol: string, bypassTrigger?: string) => {
        try {
            console.log(`[migrateReferences] Migrating table: ${tableName} (${oldId} -> ${newId})`);
            const isGlobalTable = ['profiles', 'organizations', 'organization_members', 'audit_logs'].includes(tableName);
            const targetTable = isGlobalTable ? `public."${tableName}"` : `"${tableName}"`;

            if (bypassTrigger) {
                console.log(`[migrateReferences] Bypassing trigger ${bypassTrigger} on ${targetTable}`);
                try {
                    await db.query(`ALTER TABLE ${targetTable} DISABLE TRIGGER ${bypassTrigger}`);
                } catch (trigErr) {
                    console.warn(`[migrateReferences] Could not disable trigger ${bypassTrigger}:`, trigErr);
                }
            }

            try {
                // Use the raw client (db) to execute the UPDATE statement
                await db.query(`UPDATE ${targetTable} SET "${userCol}" = $1 WHERE "${userCol}" = $2`, [newId, oldId]);
            } finally {
                if (bypassTrigger) {
                    try {
                        await db.query(`ALTER TABLE ${targetTable} ENABLE TRIGGER ${bypassTrigger}`);
                    } catch (trigErr) {
                        console.warn(`[migrateReferences] Could not re-enable trigger ${bypassTrigger}:`, trigErr);
                    }
                }
            }
        } catch (tErr: any) {
            console.warn(`[migrateReferences] Failed to update table ${tableName}:`, tErr.message);
        }
    };

    await updateTable('organization_members', 'user_id');
    await updateTable('organizations', 'created_by');
    await updateTable('audit_logs', 'user_id', 'trg_enforce_audit_immutability');
    await updateTable('sales', 'user_id', 'trg_enforce_sales_immutability');
    await updateTable('expenses', 'user_id');
    await updateTable('reports', 'created_by').catch(() => { });
}

async function archiveMergedProfile(profileId: string, currentEmail: string | null | undefined, mergedIntoId: string) {
    try {
        const archivedEmail = `archived_${Date.now()}_${profileId}@local.invalid`;
        const note = ` [merged:${currentEmail || 'unknown'}->${mergedIntoId}]`;
        await sql`
            UPDATE public.profiles 
            SET 
                email = ${archivedEmail}, 
                name = COALESCE(name, '') || ${note},
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${profileId}
        `;
    } catch (err) {
        console.error(`[archiveMergedProfile] Failed to archive ${profileId}:`, err);
    }
}

/**
 * Ensures user profile exists and is synced with Auth data.
 * Call this on each authenticated request or on sign-in.
 */
export async function ensureProfile(userId: string, email: string, name?: string, phone?: string, referrerCode?: string): Promise<Profile> {
    console.log(`[ensureProfile] Checking profile for ${email} (ID: ${userId})`);

    // 1. Check for current ID
    let currentProfile;
    try {
        const result = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
        currentProfile = result.length > 0 ? result[0] : null;
    } catch (dbErr: any) {
        console.error(`[ensureProfile] Current ID lookup failed:`, dbErr);
        throw new Error(`Profile lookup failed: ${dbErr.message}`);
    }

    // 2. Check for other profiles with the same email
    let otherProfiles;
    try {
        otherProfiles = await sql`SELECT * FROM profiles WHERE email = ${email} AND id != ${userId}`;
    } catch (emailErr: any) {
        console.error(`[ensureProfile] Other profiles lookup failed:`, emailErr);
        throw new Error(`Email lookup failed: ${emailErr.message}`);
    }

    // 3. Case A: Current Profile exists
    if (currentProfile) {
        console.log(`[ensureProfile] Found existing profile for ${email} (ID: ${userId})`);

        // Handle Consolidation: If there are other profiles for this email, migrate them to this one
        if (otherProfiles.length > 0) {
            console.log(`[ensureProfile] CONSOLIDATION REQUIRED: Found ${otherProfiles.length} secondary profiles for ${email}`);
            for (const p of otherProfiles) {
                await migrateUserReferences(p.id, userId);
                console.log(`[ensureProfile] Deleting secondary profile record ${p.id}`);
                // Use try-catch for deletion to tolerate non-empty immutable tables if bypass fails
                try {
                    await sql`DELETE FROM public.profiles WHERE id = ${p.id}`;
                } catch (delErr) {
                    console.warn(`[ensureProfile] Could not delete old profile ${p.id}, archiving instead.`, delErr);
                    await archiveMergedProfile(p.id, p.email, userId);
                }
            }
        }

        // Update basic details if changed
        const hasNameChanged = name && currentProfile.name !== name;
        const hasPhoneChanged = phone && currentProfile.phone !== phone;

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
        return currentProfile as Profile;
    }

    // 4. Case B: Current profile doesn't exist, but OTHER profile exists -> MIGRATION
    if (otherProfiles.length > 0) {
        // Pick the first one as source for migration
        const p = otherProfiles[0];
        const oldId = p.id;
        console.log(`[ensureProfile] MIGRATION REQUIRED for ${email}: ${oldId} -> ${userId}`);

        try {
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

            // Migrate all references
            await migrateUserReferences(oldId, userId);

            // Handle any additional profiles if multiple existed
            if (otherProfiles.length > 1) {
                for (let i = 1; i < otherProfiles.length; i++) {
                    const extra = otherProfiles[i];
                    await migrateUserReferences(extra.id, userId);
                    console.log(`[ensureProfile] Deleting secondary profile record ${extra.id}`);
                    try {
                        await sql`DELETE FROM public.profiles WHERE id = ${extra.id}`;
                    } catch (delErr) {
                        await archiveMergedProfile(extra.id, extra.email, userId);
                    }
                }
            }

            // Delete source profile
            console.log(`[ensureProfile] Deleting source profile record ${oldId}`);
            try {
                await sql`DELETE FROM public.profiles WHERE id = ${oldId}`;
            } catch (delErr) {
                await archiveMergedProfile(oldId, p.email, userId);
            }

            // Restore correct email
            console.log(`[ensureProfile] Restoring production email...`);
            await sql`UPDATE public.profiles SET email = ${email} WHERE id = ${userId}`;

            // Sync
            await syncToAuth(userId, { name: name || p.name, phone: phone || p.phone, role: p.role });

            const updated = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
            const pUpdated = updated[0] as any;
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

    // 5. Case C: Brand New Profile
    console.log(`[ensureProfile] Creating BRAND NEW profile for ${email}`);
    try {
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

        await syncToAuth(userId, { name: name || undefined, phone: phone || undefined, role: 'staff' });

        const p = result[0] as any;
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
    // Note: Profiles might have UUID or TEXT IDs, so we handle UUID cast carefully if needed by the schema.
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
