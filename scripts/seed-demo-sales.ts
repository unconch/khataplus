
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Helpers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

async function main() {
    try {
        console.log("Fetching inventory...");
        const inventory = await sql`SELECT * FROM inventory WHERE stock > 0`;

        if (inventory.length === 0) {
            console.error("No inventory found to generate sales from.");
            process.exit(1);
        }

        console.log(`Found ${inventory.length} items. Generating 10 demo sales...`);

        for (let i = 0; i < 10; i++) {
            // Pick random item
            const item = inventory[Math.floor(Math.random() * inventory.length)];

            // Target total amount: 2000 - 15000
            const targetTotal = randomInt(2000, 15000);

            // Base price (buy price)
            const buyPrice = parseFloat(item.buy_price);

            // Random markup 10-50%
            const markup = randomFloat(1.1, 1.5);
            const salePrice = buyPrice * markup;

            // Calculate quantity needed to reach target
            let quantity = Math.max(1, Math.round(targetTotal / salePrice));

            // Recalculate exact totals
            const gstPercent = parseFloat(item.gst_percentage || '18');
            const totalAmount = quantity * salePrice; // Assuming salePrice is inclusive for simplicity in target, or exclusive? 
            // Let's assume sale_price is unit price.
            // Total Amount = Qty * SalePrice.
            // GST Amount logic: If exclusive, Total = Qty * Price * (1+GST). 
            // If inclusive (which is common for "Total Amount"), we back calculate.
            // Let's treat sale_price as the base taxable value per unit for simplicity in DB usually, 
            // but `total_amount` in the table usually implies the final bill.

            // Let's assume `sale_price` is the unit price BEFORE tax.
            // GST = (salePrice * quantity * gstPercent / 100)
            // Total = (salePrice * quantity) + GST

            // Adjust Quantity to fit the 2k-15k range for the FINAL total
            // Final = Qty * Price * (1 + Tax)
            // Qty = Target / (Price * (1+Tax))

            const taxMultiplier = 1 + (gstPercent / 100);
            quantity = Math.max(1, Math.round(targetTotal / (salePrice * taxMultiplier)));

            // Recalculate actuals
            const taxableValue = quantity * salePrice;
            const gstAmount = taxableValue * (gstPercent / 100);
            const finalTotal = taxableValue + gstAmount;
            const profit = taxableValue - (quantity * buyPrice);

            // Insert Sale
            await sql`
                INSERT INTO sales (
                    inventory_id, 
                    quantity, 
                    sale_price, 
                    total_amount, 
                    gst_amount, 
                    profit, 
                    sale_date,
                    payment_method
                ) VALUES (
                    ${item.id}, 
                    ${quantity}, 
                    ${salePrice.toFixed(2)}, 
                    ${finalTotal.toFixed(2)}, 
                    ${gstAmount.toFixed(2)}, 
                    ${profit.toFixed(2)}, 
                    CURRENT_DATE,
                    ${Math.random() > 0.5 ? 'Cash' : 'UPI'}
                )
            `;

            // Update Stock
            await sql`
                UPDATE inventory SET stock = stock - ${quantity} WHERE id = ${item.id}
            `;

            console.log(`Generated Sale #${i + 1}: ${quantity} x ${item.name} for ₹${finalTotal.toFixed(2)}`);
        }

        console.log("✅ Successfully seeded 10 demo sales.");

    } catch (err) {
        console.error("Seeding failed:", err);
    }
}

main();
