const { neon } = require("@neondatabase/serverless");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function runMigration() {
    const targets = [];

    if (process.env.DATABASE_URL) targets.push({ name: "Production", url: process.env.DATABASE_URL });
    if (process.env.DEMO_DATABASE_URL) targets.push({ name: "Demo", url: process.env.DEMO_DATABASE_URL });

    if (targets.length === 0) {
        console.error("No database URLs found in .env.local");
        process.exit(1);
    }

    // Helper to sanitize connection strings (removes psql '...' wrapper if present)
    const sanitizeConnString = (url) => {
        if (!url) return url;
        let sanitized = url.trim();
        if (sanitized.startsWith("psql '") && sanitized.endsWith("'")) {
            sanitized = sanitized.substring(6, sanitized.length - 1);
        } else if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
            sanitized = sanitized.substring(1, sanitized.length - 1);
        }
        return sanitized;
    }

    for (const target of targets) {
        try {
            console.log(`\n[${target.name}] Starting migration...`);
            const sql = neon(sanitizeConnString(target.url));

            // 1. Add status column
            console.log(`[${target.name}] Adding 'status' column...`);
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;

            // 2. Update NULLs
            console.log(`[${target.name}] Seeding 'active' status for existing records...`);
            await sql`UPDATE profiles SET status = 'active' WHERE status IS NULL`;

            // 3. Set NOT NULL
            console.log(`[${target.name}] Applying NOT NULL constraint...`);
            await sql`ALTER TABLE profiles ALTER COLUMN status SET NOT NULL`;

            // 4. Set owner role for typical admin users as a safety net
            console.log(`[${target.name}] Ensuring roles are set to 'owner' for top-level profiles...`);
            await sql`UPDATE profiles SET role = 'owner' WHERE role IS NULL OR role = 'admin'`;

            console.log(`[${target.name}] Migration SUCCESSFUL`);
        } catch (error) {
            console.error(`[${target.name}] Migration FAILED:`, error.message);
        }
    }
    console.log("\nAll migrations attempted.");
    process.exit(0);
}

runMigration();
