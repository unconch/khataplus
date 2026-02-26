"use server"

import { sql } from "../db";
import type { Customer, KhataTransaction } from "../types";
import { authorize, audit } from "../security";
import { unstable_cache as nextCache } from "next/cache";

export async function getCustomers(orgId: string, options: { limit?: number; offset?: number } = { limit: 1000 }) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";
    const limit = options.limit ?? 1000;
    const offset = options.offset ?? 0;

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
                LIMIT ${limit}
                OFFSET ${offset}
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
        [`customers-list-${flavor}-${orgId}-${limit}-${offset}`],
        { tags: ["customers", `customers-${orgId}`, `customers-${flavor}`], revalidate: 3600 }
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
            SELECT
                k.*,
                p.name AS creator_name,
                p.email AS creator_email,
                SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END)
                    OVER (PARTITION BY k.customer_id ORDER BY k.created_at ASC, k.id ASC) AS running_balance
            FROM khata_transactions k
            LEFT JOIN profiles p ON k.created_by = p.id
            WHERE k.customer_id = ${customerId} AND k.org_id = ${orgId}
            ORDER BY k.created_at DESC, k.id DESC
        `
        : await sql`
            SELECT
                k.*,
                p.name AS creator_name,
                p.email AS creator_email,
                c.name AS customer_name,
                c.phone AS customer_phone
            FROM khata_transactions k
            LEFT JOIN profiles p ON k.created_by = p.id
            LEFT JOIN customers c ON k.customer_id = c.id
            WHERE k.org_id = ${orgId}
            ORDER BY k.created_at DESC, k.id DESC
        `;

    return data.map((row: any) => {
        const customer = row.customer_name
            ? { id: row.customer_id, name: row.customer_name, phone: row.customer_phone || "", created_at: "", updated_at: "" }
            : undefined;

        return {
            ...row,
            amount: parseFloat(row.amount),
            running_balance: row.running_balance == null ? undefined : parseFloat(row.running_balance),
            created_by_name: row.creator_name || row.creator_email || "Unknown",
            customer
        };
    }) as KhataTransaction[];
}

export async function addKhataTransaction(
    transaction: Omit<KhataTransaction, "id" | "created_at" | "created_by_name">,
    orgId: string
): Promise<KhataTransaction> {
    const user = await authorize("Add Khata Transaction", undefined, orgId);

    const inserted = await sql`
        INSERT INTO khata_transactions(customer_id, type, amount, note, sale_id, created_by, org_id)
        VALUES(${transaction.customer_id}, ${transaction.type}, ${transaction.amount}, ${transaction.note || null}, ${transaction.sale_id || null}, ${user.id}, ${orgId})
        RETURNING *
    `;

    await audit(`Khata ${transaction.type === 'credit' ? 'Credit' : 'Payment'}`, "khata_tx", inserted[0].id, {
        customer_id: transaction.customer_id,
        amount: transaction.amount
    }, orgId);

    const enriched = await sql`
        SELECT
            k.*,
            p.name AS creator_name,
            p.email AS creator_email,
            SUM(CASE WHEN k2.type = 'credit' THEN k2.amount ELSE -k2.amount END) AS running_balance
        FROM khata_transactions k
        LEFT JOIN profiles p ON k.created_by = p.id
        LEFT JOIN khata_transactions k2
            ON k2.customer_id = k.customer_id
           AND k2.org_id = k.org_id
           AND (
                k2.created_at < k.created_at OR
                (k2.created_at = k.created_at AND k2.id <= k.id)
           )
        WHERE k.id = ${inserted[0].id}
        GROUP BY k.id, p.name, p.email
        LIMIT 1
    `;

    const row = enriched[0] || inserted[0];
    return {
        ...row,
        amount: parseFloat(row.amount),
        running_balance: row.running_balance == null ? undefined : parseFloat(row.running_balance),
        created_by_name: row.creator_name || row.creator_email || "Unknown"
    } as KhataTransaction;
}

export async function updateKhataTransaction(
    txId: string,
    updates: { amount?: number; note?: string; type?: "credit" | "payment" },
    orgId: string
): Promise<KhataTransaction> {
    await authorize("Update Khata Transaction", undefined, orgId);

    if (updates.amount != null && (!Number.isFinite(updates.amount) || updates.amount <= 0)) {
        throw new Error("Amount must be greater than 0");
    }
    if (updates.type && updates.type !== "credit" && updates.type !== "payment") {
        throw new Error("Invalid transaction type");
    }

    const updatedRows = await sql`
        UPDATE khata_transactions
        SET
            amount = COALESCE(${updates.amount ?? null}, amount),
            note = COALESCE(${updates.note ?? null}, note),
            type = COALESCE(${updates.type ?? null}, type)
        WHERE id = ${txId} AND org_id = ${orgId}
        RETURNING *
    `;

    if (updatedRows.length === 0) {
        throw new Error("Transaction not found");
    }

    await audit("Updated Khata Transaction", "khata_tx", txId, updates, orgId);

    const enriched = await sql`
        SELECT
            k.*,
            p.name AS creator_name,
            p.email AS creator_email,
            SUM(CASE WHEN k2.type = 'credit' THEN k2.amount ELSE -k2.amount END) AS running_balance
        FROM khata_transactions k
        LEFT JOIN profiles p ON k.created_by = p.id
        LEFT JOIN khata_transactions k2
            ON k2.customer_id = k.customer_id
           AND k2.org_id = k.org_id
           AND (
                k2.created_at < k.created_at OR
                (k2.created_at = k.created_at AND k2.id <= k.id)
           )
        WHERE k.id = ${txId}
        GROUP BY k.id, p.name, p.email
        LIMIT 1
    `;

    const row = enriched[0] || updatedRows[0];
    return {
        ...row,
        amount: parseFloat(row.amount),
        running_balance: row.running_balance == null ? undefined : parseFloat(row.running_balance),
        created_by_name: row.creator_name || row.creator_email || "Unknown"
    } as KhataTransaction;
}

export async function deleteKhataTransaction(txId: string, orgId: string): Promise<void> {
    await authorize("Delete Khata Transaction", undefined, orgId);

    const deletedRows = await sql`
        DELETE FROM khata_transactions
        WHERE id = ${txId} AND org_id = ${orgId}
        RETURNING id, customer_id, type, amount
    `;

    if (deletedRows.length === 0) {
        throw new Error("Transaction not found");
    }

    await audit("Deleted Khata Transaction", "khata_tx", txId, {
        customer_id: deletedRows[0].customer_id,
        type: deletedRows[0].type,
        amount: Number(deletedRows[0].amount),
    }, orgId);
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
