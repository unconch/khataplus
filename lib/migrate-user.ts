"use server"

import { sql } from "./db";

/**
 * Migrates an existing Descope user to Clerk, or creates a new Clerk user.
 * This runs on first login after migration to Clerk.
 * 
 * Strategy: Match by email - if a user with this email exists with a Descope ID,
 * update all references to use the new Clerk ID.
 */
export async function migrateOrCreateUser(clerkUserId: string, email: string, name?: string) {
    // 1. Check if email exists with old Descope ID
    const existing = await sql`SELECT id, email, name, role, status FROM profiles WHERE email = ${email}`;

    if (existing.length > 0 && existing[0].id !== clerkUserId) {
        const oldId = existing[0].id;
        const existingProfile = existing[0];

        console.log(`[Migration] Migrating user ${email} from Descope ID ${oldId} to Clerk ID ${clerkUserId}`);

        // 2. Update profiles table first (this is the primary key)
        await sql`UPDATE profiles SET id = ${clerkUserId}, updated_at = CURRENT_TIMESTAMP WHERE email = ${email}`;

        // 3. Update all foreign key references
        await sql`UPDATE sales SET user_id = ${clerkUserId} WHERE user_id = ${oldId}`;
        await sql`UPDATE audit_logs SET user_id = ${clerkUserId} WHERE user_id = ${oldId}`;
        await sql`UPDATE organization_members SET user_id = ${clerkUserId} WHERE user_id = ${oldId}`;
        await sql`UPDATE organizations SET created_by = ${clerkUserId} WHERE created_by = ${oldId}`;
        await sql`UPDATE expenses SET created_by = ${clerkUserId} WHERE created_by = ${oldId}`;

        // Also update khata and supplier transactions if they exist
        try {
            await sql`UPDATE khata_transactions SET created_by = ${clerkUserId} WHERE created_by = ${oldId}`;
            await sql`UPDATE supplier_transactions SET created_by = ${clerkUserId} WHERE created_by = ${oldId}`;
        } catch (e) {
            // Tables might not exist, ignore
        }

        console.log(`[Migration] Successfully migrated user ${email}`);

        return {
            migrated: true,
            oldId,
            newId: clerkUserId,
            profile: { ...existingProfile, id: clerkUserId }
        };
    }

    // 3. If user already has Clerk ID, just return
    if (existing.length > 0 && existing[0].id === clerkUserId) {
        return { migrated: false, existing: true, profile: existing[0] };
    }

    // 4. If no existing user, create new profile
    if (existing.length === 0) {
        console.log(`[Migration] Creating new user profile for ${email} with Clerk ID ${clerkUserId}`);

        const result = await sql`
            INSERT INTO profiles (id, email, name, role, status, biometric_required) 
            VALUES (${clerkUserId}, ${email}, ${name || ""}, 'admin', 'pending', false)
            RETURNING *
        `;

        return { migrated: false, newUser: true, profile: result[0] };
    }

    return { migrated: false };
}

/**
 * Ensures user profile exists and is synced with Clerk data.
 * Call this on each authenticated request or on sign-in.
 */
export async function ensureUserProfile(clerkUserId: string, email: string, name?: string) {
    const existing = await sql`SELECT * FROM profiles WHERE id = ${clerkUserId}`;

    if (existing.length > 0) {
        // Update name if changed
        if (name && existing[0].name !== name) {
            await sql`UPDATE profiles SET name = ${name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${clerkUserId}`;
        }
        return existing[0];
    }

    // Check by email for migration
    return await migrateOrCreateUser(clerkUserId, email, name);
}
