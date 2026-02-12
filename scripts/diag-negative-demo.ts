import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const url = process.env.DEMO_DATABASE_URL;
    if (!url) {
        console.error('No demo URL');
        process.exit(1);
    }
    const sql = neon(url);

    console.log('--- DIAGNOSING NEGATIVE VALUES IN SANDBOX ---');

    const negativeProfit = await sql`SELECT id, profit, total_amount, quantity FROM sales WHERE profit < 0 AND org_id = 'demo-org'`;
    console.log('Sales with Negative Profit:', negativeProfit.length);
    if (negativeProfit.length > 0) console.log(negativeProfit.slice(0, 5));

    const negativeStock = await sql`SELECT id, name, sku, stock FROM inventory WHERE stock < 0 AND org_id = 'demo-org'`;
    console.log('Inventory with Negative Stock:', negativeStock.length);
    if (negativeStock.length > 0) console.log(negativeStock.slice(0, 5));

    const khataBalances = await sql`
        SELECT c.name, SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END) as balance
        FROM customers c
        LEFT JOIN khata_transactions k ON c.id = k.customer_id
        WHERE c.org_id = 'demo-org'
        GROUP BY c.id, c.name
        HAVING SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END) < 0
    `;
    console.log('Customers with Negative Balances:', khataBalances.length);
    if (khataBalances.length > 0) console.log(khataBalances.slice(0, 5));

    process.exit(0);
}

run();
