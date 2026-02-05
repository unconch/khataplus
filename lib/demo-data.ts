"use server"

import { sql } from "./db"
import { audit } from "./security"

/**
 * Ensures a Demo Organization exists and is populated with data.
 */
export async function setupDemoOrganization(userId: string) {
    // 1. Create or find the Demo Org
    const orgName = "KhataPlus Demo Shop"
    const orgSlug = "demo-shop"

    let org = await sql`SELECT * FROM organizations WHERE slug = ${orgSlug}`;

    if (org.length === 0) {
        org = await sql`
            INSERT INTO organizations (name, slug, gstin, address, phone)
            VALUES (${orgName}, ${orgSlug}, '18DEMO0000A1Z5', 'Boring Road, Patna, Bihar', '+91 99999 88888')
            RETURNING *
        `;
    }

    const orgId = org[0].id;

    // 2. Add user to Demo Org if not already a member
    const membership = await sql`
        SELECT * FROM organization_members 
        WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (membership.length === 0) {
        await sql`
            INSERT INTO organization_members (org_id, user_id, role)
            VALUES (${orgId}, ${userId}, 'admin')
        `;
    }

    // 3. Populate with dummy data if empty
    const inventory = await sql`SELECT id FROM inventory WHERE org_id = ${orgId} LIMIT 1`;
    if (inventory.length === 0) {
        const products = [
            { sku: 'APL-001', name: 'Fresh Apples (Local)', price: 120, stock: 45, gst: 0 },
            { sku: 'MLK-002', name: 'Organic Milk 1L', price: 65, stock: 20, gst: 5 },
            { sku: 'RCE-003', name: 'Basmati Rice 5kg', price: 550, stock: 12, gst: 5 },
            { sku: 'OIL-004', name: 'Mustard Oil 1L', price: 180, stock: 30, gst: 12 },
            { sku: 'BEV-005', name: 'Artisan Coffee 250g', price: 450, stock: 8, gst: 18 }
        ];

        for (const p of products) {
            await sql`
                INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock, org_id)
                VALUES (${p.sku}, ${p.name}, ${p.price}, ${p.gst}, ${p.stock}, ${orgId})
            `;
        }
    }

    const customers = await sql`SELECT id FROM customers WHERE org_id = ${orgId} LIMIT 1`;
    if (customers.length === 0) {
        const sampleCustomers = [
            { name: 'Amit Sharma', phone: '9876543210', address: 'House 12, Civil Lines' },
            { name: 'Priya Singh', phone: '9123456789', address: 'Flat 4B, Emerald Heights' },
            { name: 'Suresh Kumar', phone: '8877665544', address: 'Shop 5, Main Market' }
        ];

        for (const c of sampleCustomers) {
            await sql`
                INSERT INTO customers (name, phone, address, org_id)
                VALUES (${c.name}, ${c.phone}, ${c.address}, ${orgId})
            `;
        }
    }

    await audit("Joined Demo Mode", "organization", orgId, { userId }, orgId);

    return { success: true, orgId, slug: orgSlug };
}
