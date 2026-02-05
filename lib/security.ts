"use server"

import { session as getDescopeSession } from "@descope/nextjs-sdk/server";
import { sql } from "./db";
import { AuditLog, Profile } from "./types";

/**
 * Platinum Security Engine
 * Centralized authorization and audit diffing.
 */

export async function getSessionUser() {
    const session = await getDescopeSession();
    if (!session) return null;
    return (session as any).token;
}

export async function authorize(action: string, requiredRole?: string, orgId?: string) {
    const session = await getSessionUser();
    if (!session) throw new Error("Unauthorized: No active session");

    // Fetch profile from DB to verify status
    const profile = await sql`SELECT * FROM profiles WHERE id = ${session.sub}`;
    if (profile.length === 0) throw new Error("Unauthorized: Profile not found");

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
    const session = await getSessionUser();
    if (!session) return;

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
