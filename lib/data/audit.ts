"use server"

import { sql } from "../db";
import type { AuditLog } from "../types";
import { unstable_cache as nextCache } from "next/cache";

export async function createAuditLog(log: Omit<AuditLog, "id" | "created_at" | "user_email">): Promise<void> {
    await sql`
        INSERT INTO audit_logs(user_id, action, entity_type, entity_id, details, org_id)
        VALUES(${log.user_id}, ${log.action}, ${log.entity_type}, ${log.entity_id || null}, ${log.details ? JSON.stringify(log.details) : null}, ${log.org_id})
    `;
}

export const getAuditLogs = nextCache(
    async (): Promise<AuditLog[]> => {
        const data = await sql`
            SELECT a.*, p.name as user_name, p.email as user_email
            FROM audit_logs a
            LEFT JOIN profiles p ON a.user_id = p.id
            ORDER BY a.created_at DESC
            LIMIT 100
        `;
        return data as AuditLog[];
    },
    ["audit-logs-list"],
    { revalidate: 60 }
);
