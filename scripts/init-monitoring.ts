import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function init() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        return;
    }

    const sql = neon(process.env.DATABASE_URL);

    console.log("Initializing system_alerts table...");

    await sql`
    CREATE TABLE IF NOT EXISTS system_alerts (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB
    )
  `;

    console.log("✅ system_alerts table initialized.");
}

init().catch(console.error);
