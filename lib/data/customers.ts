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

            const { encrypt, decrypt } = await import("../crypto");
            const { getTenantDEK } = await import("../key-management");

            let dek: string | undefined;
            try {
                dek = await getTenantDEK(orgId);
            } catch (e) {
                console.warn(`[getCustomers] No DEK for org ${orgId}, assuming unencrypted legacy data or system org`);
            }

            const data = await db`
                SELECT c.*, 
                    COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
                FROM customers c
                LEFT JOIN khata_transactions k ON c.id = k.customer_id
                WHERE c.org_id = ${orgId}
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `;

            return Promise.all(data.map(async (row: any) => {
                let name = row.name;
                let phone = row.phone;
                let address = row.address;

                if (dek && row.name && row.name.startsWith('{')) {
                    try {
                        name = await decrypt(row.name, orgId, dek);
                        phone = row.phone ? await decrypt(row.phone, orgId, dek) : row.phone;
                        address = row.address ? await decrypt(row.address, orgId, dek) : row.address;
                    } catch (e) {
                        console.error(`[getCustomers] Decryption failed for customer ${row.id}:`, e);
                    }
                }

                return {
                    ...row,
                    name,
                    phone,
                    address,
                    balance: parseFloat(row.balance)
                };
            })) as unknown as Customer[];
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

    let name = row.name;
    let phone = row.phone;
    let address = row.address;

    if (row.name && row.name.startsWith('{')) {
        try {
            const { decrypt } = await import("../crypto");
            const { getTenantDEK } = await import("../key-management");
            const dek = await getTenantDEK(orgId);
            name = await decrypt(row.name, orgId, dek);
            phone = row.phone ? await decrypt(row.phone, orgId, dek) : row.phone;
            address = row.address ? await decrypt(row.address, orgId, dek) : row.address;
        } catch (e) {
            console.error(`[getCustomer] Decryption failed for customer ${id}:`, e);
        }
    }

    return {
        ...row,
        name,
        phone,
        address,
        balance: parseFloat(row.balance)
    } as Customer;
}

export async function addCustomer(customer: { name: string; phone: string; address?: string }, orgId: string): Promise<Customer> {
    await authorize("Add Customer", undefined, orgId);

    const { encrypt } = await import("../crypto");
    const { getTenantDEK } = await import("../key-management");
    const dek = await getTenantDEK(orgId);

    const encryptedName = await encrypt(customer.name, orgId, dek);
    const encryptedPhone = await encrypt(customer.phone, orgId, dek);
    const encryptedAddress = customer.address ? await encrypt(customer.address, orgId, dek) : null;

    const result = await sql`
        INSERT INTO customers(name, phone, address, org_id)
        VALUES(${encryptedName}, ${encryptedPhone}, ${encryptedAddress}, ${orgId})
        RETURNING *
    `;
    const newCustomer = result[0] as Customer;
    await audit("Added Customer (Encrypted)", "customer", newCustomer.id, { name: "[ENCRYPTED]" }, orgId);

    return {
        ...newCustomer,
        name: customer.name,
        phone: customer.phone,
        address: customer.address
    };
}

export async function updateCustomer(id: string, updates: Partial<Customer>, orgId: string): Promise<void> {
    await authorize("Update Customer", undefined, orgId);

    const { encrypt } = await import("../crypto");
    const { getTenantDEK } = await import("../key-management");
    const dek = await getTenantDEK(orgId);

    const encryptedName = updates.name ? await encrypt(updates.name, orgId, dek) : undefined;
    const encryptedPhone = updates.phone ? await encrypt(updates.phone, orgId, dek) : undefined;
    const encryptedAddress = updates.address ? await encrypt(updates.address, orgId, dek) : undefined;

    await sql`
        UPDATE customers
        SET 
            name = COALESCE(${encryptedName}, name),
            phone = COALESCE(${encryptedPhone}, phone),
            address = COALESCE(${encryptedAddress}, address),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND org_id = ${orgId}
    `;

    await audit("Updated Customer (Encrypted)", "customer", id, { fields: Object.keys(updates) }, orgId);
}

export async function deleteCustomer(id: string, orgId: string): Promise<void> {
    await authorize("Delete Customer", "admin", orgId);
    await sql`DELETE FROM customers WHERE id = ${id} AND org_id = ${orgId}`;
}

export async function getKhataTransactions(orgId: string, customerId?: string): Promise<KhataTransaction[]> {
    const data = customerId
        ? await sql`
            SELECT k.*, p.name as creator_name, p.email as creator_email
            FROM khata_transactions k
            JOIN profiles p ON k.created_by = p.id
            WHERE k.customer_id = ${customerId} AND k.org_id = ${orgId}
            ORDER BY k.created_at DESC
        `
        : await sql`
            SELECT k.*, p.name as creator_name, p.email as creator_email
            FROM khata_transactions k
            JOIN profiles p ON k.created_by = p.id
            WHERE k.org_id = ${orgId}
            ORDER BY k.created_at DESC
        `;

    return data.map((row: any) => ({
        ...row,
        amount: parseFloat(row.amount),
        created_by_name: row.creator_name || row.creator_email
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

export async function getOrCreateCustomerByPhone(
    name: string,
    phone: string,
    orgId: string
): Promise<Customer> {
    const customers = await getCustomers(orgId);
    const existing = customers.find(c => c.phone === phone);

    if (existing) {
        return existing;
    }

    // Create new customer
    return addCustomer({ name, phone }, orgId);
}
