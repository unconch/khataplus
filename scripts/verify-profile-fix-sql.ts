
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

async function verifyProfileFix() {
    try {
        console.log("Verifying Profile Fix via Direct SQL...");
        const testId = "00000000-0000-0000-0000-000000000001";
        const testEmail = "test-verification@example.com";
        const testName = "Verify Name";
        const testPhone = "9999999999";

        // 1. Clean up
        await sql`DELETE FROM profiles WHERE id = ${testId}`;

        // 2. Test INSERT with phone
        console.log("Testing INSERT with phone...");
        await sql`
            INSERT INTO profiles (id, email, name, phone, role, status)
            VALUES (${testId}, ${testEmail}, ${testName}, ${testPhone}, 'staff', 'pending')
        `;

        const row1 = await sql`SELECT * FROM profiles WHERE id = ${testId}`;
        console.log("Inserted Row:", { name: row1[0].name, phone: row1[0].phone });

        if (row1[0].name === testName && row1[0].phone === testPhone) {
            console.log("✅ Row 1 verification passed!");
        } else {
            throw new Error("Row 1 verification failed");
        }

        // 3. Test UPDATE with phone
        console.log("Testing UPDATE with phone...");
        const updatedPhone = "8888888888";
        await sql`
            UPDATE profiles 
            SET phone = ${updatedPhone}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${testId}
        `;

        const row2 = await sql`SELECT * FROM profiles WHERE id = ${testId}`;
        console.log("Updated Row:", { name: row2[0].name, phone: row2[0].phone });

        if (row2[0].phone === updatedPhone) {
            console.log("✅ Row 2 verification passed!");
        } else {
            throw new Error("Row 2 verification failed");
        }

        // 4. Test NULL phone
        console.log("Testing NULL phone...");
        await sql`
            UPDATE profiles 
            SET phone = NULL, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${testId}
        `;
        const row3 = await sql`SELECT * FROM profiles WHERE id = ${testId}`;
        console.log("NULL Phone Row:", { phone: row3[0].phone });

        if (row3[0].phone === null) {
            console.log("✅ Row 3 verification passed!");
        } else {
            throw new Error("Row 3 verification failed");
        }

        // 5. Clean up
        await sql`DELETE FROM profiles WHERE id = ${testId}`;
        console.log("✅ All SQL verification steps passed!");

    } catch (err) {
        console.error("❌ Verification failed:", err);
        process.exit(1);
    }
}

verifyProfileFix();
