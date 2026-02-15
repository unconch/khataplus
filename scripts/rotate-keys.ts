import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars FIRST before any other imports to prevent hoisting issues
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify ENCRYPTION_KEY is loaded
if (!process.env.ENCRYPTION_KEY) {
    console.warn("WARNING: ENCRYPTION_KEY not found in .env.local, checking .env...");
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// Now we can safely import modules that rely on process.env
import { initializeTenantDEKs, rotateMasterKey } from '../lib/key-management';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        if (command === 'init') {
            await initializeTenantDEKs();
        } else if (command === 'rotate') {
            const oldKey = args[1] || process.env.ENCRYPTION_KEY;
            const newKey = args[2];

            if (!newKey) {
                console.error("Usage: npx tsx scripts/rotate-keys.ts rotate <old_key_hex> <new_key_hex>");
                process.exit(1);
            }

            await rotateMasterKey(oldKey as string, newKey);
        } else {
            console.log("Usage:");
            console.log("  npx tsx scripts/rotate-keys.ts init");
            console.log("  npx tsx scripts/rotate-keys.ts rotate <old_key> <new_key>");
        }
    } catch (error: any) {
        console.error("Operation failed:", error.message);
        process.exit(1);
    }
    process.exit(0);
}

main();
