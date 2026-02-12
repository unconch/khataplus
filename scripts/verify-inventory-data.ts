import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log('--- Testing Inventory Data for demo-org in Sandbox ---');

    const url = process.env.DEMO_DATABASE_URL;
    if (!url) {
        console.log('No demo URL');
        return;
    }
    const sql = neon(url);

    const items = await sql`SELECT * FROM inventory WHERE org_id = 'demo-org'`;
    console.log('Inventory items in Demo DB for demo-org:', items.length);
    if (items.length > 0) {
        console.log('Sample item:', items[0].name);
        console.log('Sample item SKU:', items[0].sku);
        console.log('Sample item org_id:', items[0].org_id);
    } else {
        console.log('Checking for any items in inventory table...');
        const allItems = await sql`SELECT * FROM inventory LIMIT 5`;
        console.log('Total items found (any org):', allItems.length);
        if (allItems.length > 0) {
            console.log('First item org_id:', allItems[0].org_id);
        }
    }
}

test();
