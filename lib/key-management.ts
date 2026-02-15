import { sql } from './db-standalone';
import { encrypt, decrypt } from './crypto';
import { randomHex } from './universal-crypto';

/**
 * Platinum Security: Key Rotation & Management Utility
 * 
 * Manages the Multi-Tenant KEK/DEK Architecture:
 * - Master Key (KEK): Stored in ENV (ENCRYPTION_KEY).
 * - Tenant DEKs: Stored in DB (organizations.encrypted_dek), wrapped by KEK.
 */

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------

/**
 * Ensures all organizations have a unique DEK.
 */
export async function initializeTenantDEKs() {
    console.log("[KeyMgmt] Initializing Tenant DEKs...");
    const orgs = await sql`SELECT id FROM organizations WHERE encrypted_dek IS NULL`;

    if (orgs.length === 0) {
        console.log("[KeyMgmt] All organizations already have DEKs.");
        return;
    }

    console.log(`[KeyMgmt] Found ${orgs.length} organizations needing DEKs.`);

    for (const org of orgs) {
        // 1. Generate a strong 256-bit random DEK (in hex for storage)
        const rawDekHex = randomHex(32);

        // 2. Wrap the DEK with the current Master Key
        // Use AAD to bind the DEK to the organization context
        const wrappedDek = await encrypt(rawDekHex, `dek-wrap-${org.id}`);

        // 3. Store in DB
        await sql`
            UPDATE organizations 
            SET encrypted_dek = ${wrappedDek} 
            WHERE id = ${org.id}
        `;
        console.log(`  [KeyMgmt] Initialized DEK for Org: ${org.id}`);
    }
    console.log("[KeyMgmt] Initialization complete.");
}

// --------------------------------------------------------------------------
// Key Retrieval
// --------------------------------------------------------------------------

/**
 * Retrieves and unwraps the DEK for a specific organization.
 */
export async function getTenantDEK(orgId: string): Promise<string> {
    const res = await sql`SELECT encrypted_dek FROM organizations WHERE id = ${orgId}`;
    if (res.length === 0 || !res[0].encrypted_dek) {
        // Fallback or lazy init? For high security, we should throw.
        // But for migration period, we might return the master key? 
        // No, better to enforce.
        throw new Error(`Critical: No DEK found for organization ${orgId}`);
    }

    const wrappedDek = res[0].encrypted_dek;
    // Unwrap using Master Key and AAD context
    return await decrypt(wrappedDek, `dek-wrap-${orgId}`);
}

// --------------------------------------------------------------------------
// Master Key Rotation
// --------------------------------------------------------------------------

/**
 * Re-wraps all tenant DEKs with a new Master Key.
 * This should be run when changing the ENCRYPTION_KEY in .env.
 */
export async function rotateMasterKey(oldKeyHex: string, newKeyHex: string) {
    if (oldKeyHex.length !== 64 || newKeyHex.length !== 64) {
        throw new Error("Keys must be 64-character hex strings.");
    }

    const orgs = await sql`SELECT id, encrypted_dek FROM organizations WHERE encrypted_dek IS NOT NULL`;
    console.log(`[KeyMgmt] Rotating Master Key for ${orgs.length} tenants...`);

    let successCount = 0;
    let failCount = 0;

    for (const org of orgs) {
        try {
            // 1. Unwrap with OLD key
            const rawDekHex = await decrypt(org.encrypted_dek, `dek-wrap-${org.id}`, oldKeyHex);

            // 2. Re-wrap with NEW key
            const rewrappedDek = await encrypt(rawDekHex, `dek-wrap-${org.id}`, newKeyHex);

            // 3. Update DB
            await sql`
                UPDATE organizations 
                SET encrypted_dek = ${rewrappedDek} 
                WHERE id = ${org.id}
            `;
            successCount++;
        } catch (err: any) {
            console.error(`  [KeyMgmt] Failed to rotate for Org ${org.id}: ${err.message}`);
            failCount++;
        }
    }

    console.log(`[KeyMgmt] Rotation complete. Success: ${successCount}, Failed: ${failCount}`);
    if (failCount > 0) {
        throw new Error("Master Key rotation completed with errors. DO NOT decommission the old key yet.");
    }
}
