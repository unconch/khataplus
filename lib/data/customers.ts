"use server"

import { sql } from "../db";
import type { Customer, KhataTransaction } from "../types";
import { authorize, audit } from "../security";
import { unstable_cache as nextCache } from "next/cache";

export async function getCustomers(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<Customer[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const data = await db`
                SELECT c.*, 
                    COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
                FROM customers c
                LEFT JOIN khata_transactions k ON c.id = k.customer_id
                WHERE c.org_id = ${orgId}
                GROUP BY c.id
                ORDER BY c.name ASC
            `;
            return data.map((row: any) => ({
                ...row,
                balance: parseFloat(row.balance)
            })) as Customer[];
        },
        [`customers-list-${flavor}-${orgId}`],
        { tags: ["customers", `customers-${orgId}`, `customers-${flavor}`], revalidate: 300 }
    )();
}

export async function getCustomer(id: string, orgId: string): Promise<Customer | null> {
    const data = await sql`
        SELECT c.*, 
            COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
        FROM customers c
        LEFT JOIN khata_transactions k ON c.id = k.customer_id
        WHERE c.id = ${id} AND c.org_id = ${orgId}
        GROUP BY c.id
    `;
    if (data.length === 0) return null;
    const row = data[0];
    return {
        ...row,
        balance: parseFloat(row.balance)
    } as Customer;
}

export async function addCustomer(customer: { name: string; phone: string; address?: string }, orgId: string): Promise<Customer> {
    await authorize("Add Customer", undefined, orgId);

    const result = await sql`
        INSERT INTO customers(name, phone, address, org_id)
        VALUES(${customer.name}, ${customer.phone}, ${customer.address || null}, ${orgId})
        RETURNING *
    `;
    const newCustomer = result[0] as Customer;
    await audit("Added Customer", "customer", newCustomer.id, { name: customer.name }, orgId);
    return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>, orgId: string): Promise<void> {
    await authorize("Update Customer", undefined, orgId);
    await sql`
        UPDATE customers
        SET 
            name = COALESCE(${updates.name}, name),
            phone = COALESCE(${updates.phone}, phone),
            address = COALESCE(${updates.address}, address),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND org_id = ${orgId}
    `;
}

export async function deleteCustomer(id: string, orgId: string): Promise<void> {
    await authorize("Delete Customer", "admin", orgId);
    await sql`DELETE FROM customers WHERE id = ${id} AND org_id = ${orgId}`;
}

export async function getKhataTransactions(orgId: string, customerId?: string): Promise<KhataTransaction[]> {
    const data = customerId
        ? await sql`
            FROM khata_transactions k
            JOIN profiles p ON k.created_by = p.id
            WHERE k.customer_id = ${customerId} AND k.org_id = ${orgId}
            ORDER BY k.created_at DESC
        `
        : await sql`
            FROM khata_transactions k
            JOIN profiles p ON k.created_by = p.id
            WHERE k.org_id = ${orgId}
            ORDER BY k.created_at DESC
        `;

    return data.map((row: any) => ({
        ...row,
        amount: parseFloat(row.amount),
        created_by_name: row.name || row.email
    })) as KhataTransaction[];
}

export async function addKhataTransaction(
    transaction: Omit<KhataTransaction, "id" | "created_at" | "created_by_name">,
    orgId: string
): Promise<KhataTransaction> {
    const user = await authorize("Add Khata Transaction", undefined, orgId);

    const result = await sql`
        INSERT INTO khata_transactions(customer_id, type, amount, note, sale_id, created_by, org_id)
        VALUES(${transaction.customer_id}, ${transaction.type}, ${transaction.amount}, ${transaction.note || null}, ${transaction.sale_id || null}, ${user.id}, ${orgId})
        RETURNING *
    `;

    await audit(`Khata ${transaction.type === 'credit' ? 'Credit' : 'Payment'}`, "khata_tx", result[0].id, {
        customer_id: transaction.customer_id,
        amount: transaction.amount
    }, orgId);

    return result[0] as KhataTransaction;
}

export async function getCustomerBalance(customerId: string, orgId: string): Promise<number> {
    const result = await sql`
        SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance
        FROM khata_transactions
        WHERE customer_id = ${customerId} AND org_id = ${orgId}
    `;
    return parseFloat(result[0]?.balance || "0");
}
