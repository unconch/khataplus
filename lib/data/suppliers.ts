"use server"

import { sql } from "../db";
import type { Supplier, SupplierTransaction } from "../types";
import { authorize, audit } from "../security";
import { unstable_cache as nextCache } from "next/cache";
import { getCurrentOrgId } from "./auth";

export async function getSuppliers(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<Supplier[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const data = await db`
                SELECT s.*, 
                    COALESCE(SUM(CASE WHEN st.type = 'purchase' THEN st.amount ELSE -st.amount END), 0) as balance
                FROM suppliers s
                LEFT JOIN supplier_transactions st ON s.id = st.supplier_id
                WHERE s.org_id = ${orgId}
                GROUP BY s.id
                ORDER BY s.name ASC
            `;
            return data.map((row: any) => ({
                ...row,
                balance: parseFloat(row.balance)
            })) as Supplier[];
        },
        [`suppliers-list-${flavor}-${orgId}`],
        { tags: ["suppliers", `suppliers-${orgId}`, `suppliers-${flavor}`], revalidate: 300 }
    )();
}

export async function getSupplier(id: string, orgId: string): Promise<Supplier | null> {
    const data = await sql`
        SELECT s.*, 
            COALESCE(SUM(CASE WHEN st.type = 'purchase' THEN st.amount ELSE -st.amount END), 0) as balance
        FROM suppliers s
        LEFT JOIN supplier_transactions st ON s.id = st.supplier_id
        WHERE s.id = ${id} AND s.org_id = ${orgId}
        GROUP BY s.id
    `;
    if (data.length === 0) return null;
    const row = data[0];
    return {
        ...row,
        balance: parseFloat(row.balance)
    } as Supplier;
}

export async function addSupplier(supplier: { name: string; phone?: string; address?: string; gstin?: string }, orgId: string): Promise<Supplier> {
    await authorize("Add Supplier", "admin", orgId);

    const result = await sql`
        INSERT INTO suppliers(name, phone, address, gstin, org_id)
        VALUES(${supplier.name}, ${supplier.phone || null}, ${supplier.address || null}, ${supplier.gstin || null}, ${orgId})
        RETURNING *
    `;
    const newSupplier = result[0] as Supplier;
    await audit("Added Supplier", "supplier", newSupplier.id, { name: newSupplier.name }, orgId);
    return newSupplier;
}

export async function getSupplierTransactions(orgId: string, supplierId?: string): Promise<SupplierTransaction[]> {
    const data = supplierId
        ? await sql`
            SELECT st.*, p.name as creator_name, p.email as creator_email
            FROM supplier_transactions st
            JOIN profiles p ON st.created_by = p.id
            WHERE st.supplier_id = ${supplierId} AND st.org_id = ${orgId}
            ORDER BY st.created_at DESC
        `
        : await sql`
            SELECT st.*, p.name as creator_name, p.email as creator_email
            FROM supplier_transactions st
            JOIN profiles p ON st.created_by = p.id
            WHERE st.org_id = ${orgId}
            ORDER BY st.created_at DESC
        `;

    return data.map((row: any) => ({
        ...row,
        amount: parseFloat(row.amount),
        created_by_name: row.name || row.email
    })) as SupplierTransaction[];
}

export async function addSupplierTransaction(
    transaction: Omit<SupplierTransaction, "id" | "created_at" | "created_by_name">,
    orgId?: string
): Promise<SupplierTransaction> {
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    const user = await authorize("Add Supplier Transaction", "admin", actualOrgId);

    const result = await sql`
        INSERT INTO supplier_transactions(supplier_id, type, amount, note, invoice_no, created_by, org_id)
        VALUES(${transaction.supplier_id}, ${transaction.type}, ${transaction.amount}, ${transaction.note || null}, ${transaction.invoice_no || null}, ${user.id}, ${actualOrgId})
        RETURNING *
    `;

    await audit(`Supplier ${transaction.type === 'purchase' ? 'Purchase' : 'Payment'}`, "supplier_tx", result[0].id, {
        supplier_id: transaction.supplier_id,
        amount: transaction.amount
    }, actualOrgId);

    return result[0] as SupplierTransaction;
}

export async function getSupplierBalance(supplierId: string, orgId: string): Promise<number> {
    const result = await sql`
        SELECT COALESCE(SUM(CASE WHEN type = 'purchase' THEN amount ELSE -amount END), 0) as balance
        FROM supplier_transactions
        WHERE supplier_id = ${supplierId} AND org_id = ${orgId}
    `;
    return parseFloat(result[0]?.balance || "0");
}
