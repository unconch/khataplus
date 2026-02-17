import { Client } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const client = new Client(process.env.DATABASE_URL!);
    await client.connect();

    console.log("Checking Table: customers");
    const customersCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers'");
    console.table(customersCols.rows);

    console.log("Checking Table: khata_transactions");
    const khataCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'khata_transactions'");
    console.table(khataCols.rows);

    await client.end();
}

checkSchema();
