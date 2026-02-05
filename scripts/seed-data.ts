
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load env 
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log('Seeding data...');
    const items = [
        { sku: 'CLTH-001', name: 'Cotton Check Shirt (L)', buy_price: 850.00, gst_percentage: 12, stock: 45 },
        { sku: 'CLTH-002', name: 'Slim Fit Denim Jeans', buy_price: 1450.00, gst_percentage: 12, stock: 30 },
        { sku: 'CLTH-003', name: 'Banarasi Silk Saree', buy_price: 4200.00, gst_percentage: 5, stock: 12 },
        { sku: 'CLTH-004', name: 'Linen Kurta (White)', buy_price: 1100.00, gst_percentage: 5, stock: 25 },
        { sku: 'CLTH-005', name: 'Printed T-Shirt (M)', buy_price: 450.00, gst_percentage: 12, stock: 60 },
        { sku: 'CLTH-006', name: 'Formal Trousers (Black)', buy_price: 1200.00, gst_percentage: 12, stock: 20 },
        { sku: 'CLTH-007', name: 'Winter Woolen Jacket', buy_price: 2800.00, gst_percentage: 18, stock: 8 },
    ];

    for (const item of items) {
        try {
            await sql`
            INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock)
            VALUES (${item.sku}, ${item.name}, ${item.buy_price}, ${item.gst_percentage}, ${item.stock})
            ON CONFLICT (sku) DO NOTHING
        `;
            console.log(`Upserted: ${item.sku}`);
        } catch (e) {
            console.error(`Failed to insert ${item.sku}:`, e);
        }
    }
    console.log('Done!');
}

main();
