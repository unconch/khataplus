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
        console.log('🚀 Refining Demo Data Context...');

        const demoOrgId = 'demo-org';

        // 1. Cleanup Old Demo Data to prevent duplicates/negatives
        console.log('--- Cleaning up existing demo data ---');
        await sql`DELETE FROM khata_transactions WHERE org_id = ${demoOrgId}`;
        await sql`DELETE FROM daily_reports WHERE org_id = ${demoOrgId}`;
        await sql`DELETE FROM sales WHERE org_id = ${demoOrgId}`;
        await sql`DELETE FROM customers WHERE org_id = ${demoOrgId}`;
        await sql`DELETE FROM inventory WHERE org_id = ${demoOrgId}`;
        console.log('✓ Cleanup complete');

        // 2. Ensure Demo Org exists
        await sql`
            INSERT INTO organizations (id, name, slug, created_by)
            VALUES (${demoOrgId}, 'KhataPlus Demo Shop', 'demo', 'system')
            ON CONFLICT (id) DO UPDATE SET name = 'KhataPlus Demo Shop'
        `;

        // 3. Diversified Inventory
        const inventoryItems = [
            // Apparel (The original base)
            { sku: 'CLTH-001', name: 'Cotton Check Shirt (L)', buy_price: 850, gst: 12, stock: 50 },
            { sku: 'CLTH-002', name: 'Slim Fit Denim Jeans', buy_price: 1450, gst: 12, stock: 40 },
            { sku: 'CLTH-003', name: 'Banarasi Silk Saree', buy_price: 4200, gst: 5, stock: 15 },
            { sku: 'CLTH-007', name: 'Winter Woolen Jacket', buy_price: 2800, gst: 18, stock: 10 },

            // Electronics (New Variety)
            { sku: 'ELEC-101', name: 'Wireless Noise Buds Pro', buy_price: 1899, gst: 18, stock: 25 },
            { sku: 'ELEC-102', name: 'Fast Charge Power Bank 20k', buy_price: 1250, gst: 18, stock: 35 },
            { sku: 'ELEC-103', name: 'Smart Fitness Band V4', buy_price: 2100, gst: 18, stock: 20 },

            // Groceries & Essentials
            { sku: 'GROC-201', name: 'Premium Basmati Rice (5kg)', buy_price: 650, gst: 5, stock: 100 },
            { sku: 'GROC-202', name: 'Organic Cold Pressed Mustard Oil', buy_price: 180, gst: 5, stock: 80 },
            { sku: 'GROC-203', name: 'Himalayan Pink Salt (1kg)', buy_price: 45, gst: 0, stock: 200 },

            // Footwear
            { sku: 'FOOT-301', name: 'High-Traction Running Shoes', buy_price: 2450, gst: 18, stock: 18 },
            { sku: 'FOOT-302', name: 'Classic Leather Loafers', buy_price: 1750, gst: 12, stock: 12 }
        ];

        console.log('Seeding diversified inventory...');
        for (const item of inventoryItems) {
            await sql`
                INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock, org_id)
                VALUES (${item.sku}, ${item.name}, ${item.buy_price}, ${item.gst}, ${item.stock}, ${demoOrgId})
            `;
        }
        console.log(`✓ Seeded ${inventoryItems.length} categories`);

        // 4. Seed Customers
        console.log('Seeding customers...');
        const customerData = [
            { name: 'Amit Sharma', phone: '9876543210', address: 'House 12, Civil Lines' },
            { name: 'Priya Singh', phone: '9123456789', address: 'Flat 4B, Emerald Heights' },
            { name: 'Suresh Kumar', phone: '8877665544', address: 'Shop 5, Main Market' }
        ];

        // Ensure we cleanup by phone too if they exist globally in this demo DB
        for (const c of customerData) {
            await sql`DELETE FROM customers WHERE phone = ${c.phone}`;
        }

        for (const c of customerData) {
            await sql`
                INSERT INTO customers (name, phone, address, org_id)
                VALUES (${c.name}, ${c.phone}, ${c.address}, ${demoOrgId})
                ON CONFLICT (phone) DO NOTHING
            `;
        }
        const customers = await sql`SELECT * FROM customers WHERE org_id = ${demoOrgId}`;
        console.log(`✓ Seeded ${customers.length} customers`);

        // 5. Temporal Sales Simulation (30 Days)
        console.log('Simulating 30 days of sales...');
        const inventory = await sql`SELECT * FROM inventory WHERE org_id = ${demoOrgId}`;

        const allSales: any[] = [];
        const stockUpdates: Map<string, number> = new Map();
        const dailyAgg: Map<string, any> = new Map();

        // Initialize local stock tracker
        for (const item of inventory) {
            stockUpdates.set(item.id, item.stock);
        }

        for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
            const saleDate = new Date();
            saleDate.setDate(saleDate.getDate() - dayOffset);
            const dateStr = saleDate.toISOString().split('T')[0];

            // Daily volume: 2 to 8 sales per day for demo org
            const dailyVolume = randomInt(2, 8);

            let dailyGross = 0;
            let dailyCost = 0;
            let dailyCash = 0;
            let dailyOnline = 0;

            for (let s = 0; s < dailyVolume; s++) {
                const item = inventory[Math.floor(Math.random() * inventory.length)];

                // Get stock from local tracker
                let currentStock = stockUpdates.get(item.id)!;

                if (currentStock <= 2) continue; // Safety: Never go negative or below 2

                const quantity = randomInt(1, Math.min(3, currentStock - 1));
                const markup = randomFloat(1.15, 1.45); // 15% to 45% margin
                const salePrice = parseFloat((item.buy_price * markup).toFixed(2));
                const taxableValue = quantity * salePrice;
                const gstPercent = parseFloat(item.gst_percentage);
                const gstAmount = taxableValue * (gstPercent / 100);
                const totalAmount = taxableValue + gstAmount;
                const cost = quantity * item.buy_price;
                const profit = taxableValue - cost;
                const paymentMethod = Math.random() > 0.4 ? 'UPI' : 'Cash';

                allSales.push({
                    inventory_id: item.id,
                    quantity,
                    sale_price: salePrice,
                    total_amount: totalAmount,
                    gst_amount: gstAmount,
                    profit,
                    sale_date: dateStr,
                    created_at: saleDate.toISOString(),
                    payment_method: paymentMethod,
                    org_id: demoOrgId
                });

                // Update local trackers
                stockUpdates.set(item.id, currentStock - quantity);
                dailyGross += totalAmount;
                dailyCost += cost;
                if (paymentMethod === 'Cash') dailyCash += totalAmount;
                else dailyOnline += totalAmount;
            }

            dailyAgg.set(dateStr, {
                date: dateStr,
                gross: dailyGross,
                cost: dailyCost,
                cash: dailyCash,
                online: dailyOnline,
                expenses: randomInt(50, 200) // Small daily expenses
            });
        }

        console.log(`Prepared ${allSales.length} sales. Batch inserting...`);

        // Batch Insert Sales
        if (allSales.length > 0) {
            for (const sale of allSales) {
                await sql`
                    INSERT INTO sales (
                        inventory_id, quantity, sale_price, total_amount, gst_amount, profit, 
                        sale_date, created_at, payment_method, org_id
                    ) VALUES (
                        ${sale.inventory_id}, ${sale.quantity}, ${sale.sale_price}, ${sale.total_amount}, 
                        ${sale.gst_amount}, ${sale.profit}, ${sale.sale_date}, ${sale.created_at}, 
                        ${sale.payment_method}, ${sale.org_id}
                    )
                `;
            }
        }

        // 6. Seed Daily Reports
        console.log('Seeding daily reports...');
        for (const [date, data] of dailyAgg.entries()) {
            await sql`
                INSERT INTO daily_reports (
                    report_date, total_sale_gross, total_cost, cash_sale, online_sale, 
                    expenses, online_cost, org_id
                ) VALUES (
                    ${date}, ${data.gross}, ${data.cost}, ${data.cash}, ${data.online}, 
                    ${data.expenses}, 0, ${demoOrgId}
                )
            `;
        }
        console.log(`✓ Seeded ${dailyAgg.size} reports`);

        // 7. Batch Update Inventory
        console.log("Updating stock levels...");
        const updatePromises = [];
        for (const [id, newStock] of stockUpdates.entries()) {
            updatePromises.push(sql`UPDATE inventory SET stock = ${newStock} WHERE id = ${id}`);
        }
        await Promise.all(updatePromises);

        console.log('✓ Sales & Reports simulation complete');

        // 8. Khata (Credit) Transactions
        console.log('Adding sample khata transactions...');
        if (customers.length > 0) {
            for (const customer of customers) {
                // Initial Credit
                await sql`
                    INSERT INTO khata_transactions (customer_id, type, amount, note, org_id)
                    VALUES (${customer.id}, 'credit', 2500, 'Initial Opening Balance', ${demoOrgId})
                `;
                // Partial Payment
                await sql`
                    INSERT INTO khata_transactions (customer_id, type, amount, note, org_id)
                    VALUES (${customer.id}, 'payment', 1000, 'Weekly payment', ${demoOrgId})
                `;
            }
        }

        // 9. Finalizing
        console.log('✓ Success. Please refresh the dashboard.');

    } catch (err) {
        console.error('FAILED:', err);
    }
    process.exit(0);
}

main();
