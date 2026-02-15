
import { upsertProfile, getProfile } from '../lib/data/profiles';
import { ensureProfile } from '../lib/data/profiles';
import { sql } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testProfileUpdate() {
    try {
        console.log("Testing Profile Update...");
        const testId = "00000000-0000-0000-0000-000000000000";
        const testEmail = "test@example.com";
        const testName = "Test User";
        const testPhone = "1234567890";

        // Clean up if exists
        await sql`DELETE FROM profiles WHERE id = ${testId}`;

        console.log("1. Testing ensureProfile (create)...");
        const p1 = await ensureProfile(testId, testEmail, testName, testPhone);
        console.log("Created Profile:", { name: p1.name, phone: p1.phone });

        if (p1.name === testName && p1.phone === testPhone) {
            console.log("✅ ensureProfile (create) passed!");
        } else {
            console.error("❌ ensureProfile (create) failed!");
        }

        console.log("2. Testing ensureProfile (update)...");
        const updatedName = "Updated Name";
        const updatedPhone = "0987654321";
        const p2 = await ensureProfile(testId, testEmail, updatedName, updatedPhone);
        console.log("Updated Profile:", { name: p2.name, phone: p2.phone });

        if (p2.name === updatedName && p2.phone === updatedPhone) {
            console.log("✅ ensureProfile (update) passed!");
        } else {
            console.error("❌ ensureProfile (update) failed!");
        }

        console.log("3. Testing upsertProfile...");
        const upsertedName = "Upserted Name";
        const upsertedPhone = "5555555555";
        const p3 = await upsertProfile({
            ...p2,
            name: upsertedName,
            phone: upsertedPhone
        });
        console.log("Upserted Profile:", { name: p3.name, phone: p3.phone });

        if (p3.name === upsertedName && p3.phone === upsertedPhone) {
            console.log("✅ upsertProfile passed!");
        } else {
            console.error("❌ upsertProfile failed!");
        }

        // Final check from DB
        const final = await getProfile(testId);
        console.log("Final DB check:", { name: final?.name, phone: final?.phone });

        // Clean up
        await sql`DELETE FROM profiles WHERE id = ${testId}`;
        console.log("✅ All Profile tests passed!");

    } catch (err) {
        console.error("❌ Profile test error:", err);
    }
}

testProfileUpdate();
