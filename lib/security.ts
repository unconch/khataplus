import { getSession } from "./session";
import { sql } from "./db";
import { AuditLog, Profile } from "./types";

/**
 * KhataPlus Security Engine
 * Centralized authorization and audit diffing.
 */

export async function getSessionUser() {
    const sessionRes = await getSession();
    const userId = sessionRes?.userId;
    if (!userId) {
        return null;
    }
    return { sub: userId };
}

export async function authorize(action: string, requiredRole?: string, orgId?: string) {
    const { isGuestMode } = await import("./data/auth");
    const isGuest = await isGuestMode();

    if (isGuest) {
        return {
            id: "guest-user",
            name: "Guest User",
            email: "guest@khataplus.demo",
            role: "owner",
            status: "active",
            organization_id: "demo-org",
            biometric_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as Profile;
    }

    const session = await getSessionUser();
    if (!session) {
        throw new Error("Unauthorized: No active session");
    }

    // Fetch profile from DB
    const profile = await sql`SELECT * FROM profiles WHERE id = ${session.sub}`;
    if (profile.length === 0) {
        throw new Error("Unauthorized: Profile not found");
    }

    const user = profile[0] as Profile;

    const normalizedRole = String(user.role || "").toLowerCase();
    const hasValidRole = ["owner", "main admin", "admin", "manager", "staff"].includes(normalizedRole);

    // Access is role-based only. Account status is not used for authorization.
    if (!hasValidRole) {
        throw new Error(`Unauthorized: Invalid user role ${user.role || "unknown"}`);
    }

    // If orgId is provided, ALWAYS check organization membership — even for owners.
    // This prevents owner-of-org-A from acting on org-B by posting org-B's orgId.
    if (orgId) {
        const membership = await sql`
            SELECT role FROM organization_members 
            WHERE org_id = ${orgId} AND user_id = ${user.id}
        `;

        if (membership.length === 0) {
            throw new Error(`Forbidden: You are not a member of this organization`);
        }

        const orgRole = membership[0].role;
        const isOrgOwnerOrAdmin = orgRole === "admin" || orgRole === "owner";

        if (requiredRole === "owner" && orgRole !== "owner") {
            throw new Error(`Forbidden: Organization owner privileges required`);
        }

        if (requiredRole === "admin" && !isOrgOwnerOrAdmin) {
            throw new Error(`Forbidden: Organization admin privileges required`);
        }

        if (requiredRole && requiredRole !== "admin" && requiredRole !== "owner" && !secureCompare(orgRole, requiredRole)) {
            throw new Error(`Forbidden: Required organization role ${requiredRole}`);
        }

        return { ...user, orgRole }; // Return user with org context
    }

    // MISSION-CRITICAL: Remove global bypass. Role must match exactly.
    // To allow a "Super Admin", add a dedicated is_system_admin flag to the profile.
    if (requiredRole && !secureCompare(user.role, requiredRole)) {
        throw new Error(`Forbidden: Required role ${requiredRole}`);
    }

    return user;
}

/**
 * Creates an encrypted, immutable audit log entry.
 */
export async function audit(action: string, entity: string, id: string | undefined, details: any, orgId?: string) {
    const { isGuestMode } = await import("./data/auth");
    if (await isGuestMode()) {
        return;
    } // Skip auditing for guests to keep sandbox clean

    const session = await getSessionUser();
    if (!session) {
        return;
    }

    // OPTIMIZED AUDIT LOGS: Encrypt sensitive details to prevent DB-level PII leaks
    // MISSION-CRITICAL: Use Tenant-specific DEK for isolated encryption (ASVS Level 3)
    const { encrypt } = await import("./crypto");
    const { getTenantDEK } = await import("./key-management");

    let encryptedDetails: string;
    try {
        const orgIdContext = orgId || "system";
        let encryptionKey: string | undefined;

        if (orgId) {
            encryptionKey = await getTenantDEK(orgId);
        }

        encryptedDetails = await encrypt(JSON.stringify(details), orgIdContext, encryptionKey);
    } catch (err: any) {
        console.error("[Audit] Failed to encrypt audit details:", err.message);
        // Fallback to system-level encryption if DEK fails, to ensure audit trail continuity
        encryptedDetails = await encrypt(JSON.stringify(details), "system-fallback");
    }

    await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, org_id)
        VALUES (${session.sub}, ${action}, ${entity}, ${id}, ${encryptedDetails}, ${orgId || null})
    `;
}

/**
 * Generates a diff between two objects for granular auditing.
 */
export async function generateDiff(oldData: any, newData: any) {
    const diff: any = {};
    for (const key in newData) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            diff[key] = {
                old: oldData[key],
                new: newData[key]
            };
        }
    }
    return diff;
}

/**
 * Constant-time comparison for secrets to prevent timing attacks.
 * Uses Node.js crypto.timingSafeEqual. When lengths differ, hashes both
 * to a fixed-length digest to avoid leaking length information.
 */
export function secureCompare(a: string, b: string): boolean {
    const nodeCrypto = require('crypto');
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        // Hash both to constant length to avoid leaking length info via early return
        const hashA = nodeCrypto.createHash('sha256').update(bufA).digest();
        const hashB = nodeCrypto.createHash('sha256').update(bufB).digest();
        nodeCrypto.timingSafeEqual(hashA, hashB); // consume constant time
        return false;
    }

    return nodeCrypto.timingSafeEqual(bufA, bufB);
}
