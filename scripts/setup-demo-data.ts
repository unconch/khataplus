import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

// Use DEMO_DATABASE_URL explicitly for this script, fallback to DATABASE_URL if running manually against another DB
const connectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('No connection string found. Please set DEMO_DATABASE_URL in .env.local');
    process.exit(1);
}

const sql = neon(connectionString);

// Helpers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

async function main() {
    try {
        console.log('🚀 Setting up Demo Data...');

        // 1. Create Demo Org
        const demoOrg = {
            id: 'demo-org',
            name: 'Demo Organization',
            slug: 'demo',
            created_by: 'system'
        };

        await sql`
        INSERT INTO organizations (id, name, slug, created_by)
        VALUES (${demoOrg.id}, ${demoOrg.name}, ${demoOrg.slug}, ${demoOrg.created_by})
        ON CONFLICT (id) DO NOTHING
    `;
        console.log('✓ Demo Organization created');

        // 2. Create Inventory
        const items = [
            { sku: 'CLTH-001', name: 'Cotton Check Shirt (L)', buy_price: 850.00, gst_percentage: 12, stock: 45 },
            { sku: 'CLTH-002', name: 'Slim Fit Denim Jeans', buy_price: 1450.00, gst_percentage: 12, stock: 30 },
            { sku: 'CLTH-003', name: 'Banarasi Silk Saree', buy_price: 4200.00, gst_percentage: 5, stock: 12 },
            { sku: 'CLTH-004', name: 'Linen Kurta (White)', buy_price: 1100.00, gst_percentage: 5, stock: 25 },
            { sku: 'CLTH-005', name: 'Printed T-Shirt (M)', buy_price: 450.00, gst_percentage: 12, stock: 60 },
            { sku: 'CLTH-006', name: 'Formal Trousers (Black)', buy_price: 1200.00, gst_percentage: 12, stock: 20 },
            { sku: 'CLTH-007', name: 'Winter Woolen Jacket', buy_price: 2800.00, gst_percentage: 18, stock: 8 },
        ];

        console.log('Seeding inventory...');
        for (const item of items) {
            await sql`
            INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock, org_id)
            VALUES (${item.sku}, ${item.name}, ${item.buy_price}, ${item.gst_percentage}, ${item.stock}, ${demoOrg.id})
            ON CONFLICT (sku) 
            DO UPDATE SET org_id = ${demoOrg.id}
        `;
        }
        console.log(`✓ Seeded ${items.length} inventory items`);

        // 3. Generate Sales
        console.log("Generating demo sales...");
        // Fetch fresh inventory from DB to get IDs
        const inventory = await sql`SELECT * FROM inventory WHERE org_id = ${demoOrg.id}`;

        if (inventory.length === 0) {
            console.error("No inventory found.");
            process.exit(1);
        }

        for (let i = 0; i < 15; i++) {
            const item = inventory[Math.floor(Math.random() * inventory.length)];
            const targetTotal = randomInt(2000, 15000);
            const buyPrice = parseFloat(item.buy_price);
            const markup = randomFloat(1.1, 1.5);
            const salePrice = buyPrice * markup;

            // Simple tax logic for demo
            const gstPercent = parseFloat(item.gst_percentage || '18');
            const taxMultiplier = 1 + (gstPercent / 100);
            const quantity = Math.max(1, Math.round(targetTotal / (salePrice * taxMultiplier)));

            const taxableValue = quantity * salePrice;
            const gstAmount = taxableValue * (gstPercent / 100);
            const finalTotal = taxableValue + gstAmount;
            const profit = taxableValue - (quantity * buyPrice);

            // Insert Sale linked to Org
            await sql`
                INSERT INTO sales (
                    inventory_id, 
                    quantity, 
                    sale_price, 
                    total_amount, 
                    gst_amount, 
                    profit, 
                    sale_date,
                    payment_method,
                    org_id
                ) VALUES (
                    ${item.id}, 
                    ${quantity}, 
                    ${salePrice.toFixed(2)}, 
                    ${finalTotal.toFixed(2)}, 
                    ${gstAmount.toFixed(2)}, 
                    ${profit.toFixed(2)}, 
                    CURRENT_DATE,
                    ${Math.random() > 0.5 ? 'Cash' : 'UPI'},
                    ${demoOrg.id}
                )
            `;

            // Update Stock
            await sql`
                UPDATE inventory SET stock = stock - ${quantity} WHERE id = ${item.id}
            `;
        }

        console.log("✅ Successfully seeded demo sales.");
    } catch (err) {
        console.error("Setup failed:", err);
    }
    process.exit(0);
}

main();
