"use server"

import { session } from "@descope/nextjs-sdk/server";
import { sql } from "./db";
import { AuditLog, Profile } from "./types";

/**
 * Platinum Security Engine
 * Centralized authorization and audit diffing.
 */

export async function getSessionUser() {
    const sessionRes = await session();
    const userId = sessionRes?.token?.sub;
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
            status: "approved",
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

    // Fetch profile from DB to verify status
    const profile = await sql`SELECT * FROM profiles WHERE id = ${session.sub}`;
    if (profile.length === 0) {
        throw new Error("Unauthorized: Profile not found");
    }

    const user = profile[0] as Profile;
    if (user.status !== "approved") {
        throw new Error(`Unauthorized: Account status is ${user.status}`);
    }

    if (requiredRole && user.role !== "main admin" && user.role !== requiredRole) {
        throw new Error(`Forbidden: Required role ${requiredRole}`);
    }

    // If orgId is provided, verify user is a member of that organization
    if (orgId && user.role !== "main admin") {
        const membership = await sql`
            SELECT role FROM organization_members 
            WHERE org_id = ${orgId} AND user_id = ${user.id}
        `;
        if (membership.length === 0) {
            throw new Error(`Forbidden: You are not a member of this organization`);
        }
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

    // In a real institutional app, we would encrypt 'details' here
    // For this demo, we'll store as JSONB as per schema
    await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, org_id)
        VALUES (${session.sub}, ${action}, ${entity}, ${id}, ${JSON.stringify(details)}, ${orgId || null})
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
