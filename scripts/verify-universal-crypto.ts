
import { encrypt, decrypt } from '../lib/crypto';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testCrypto() {
    try {
        console.log("Testing Crypto...");
        const secret = "This is a secret message!";
        const context = "test-context";

        console.log("Original:", secret);

        const encrypted = await encrypt(secret, context);
        console.log("Encrypted:", encrypted);

        const decrypted = await decrypt(encrypted, context);
        console.log("Decrypted:", decrypted);

        if (secret === decrypted) {
            console.log("✅ Crypto test passed!");
        } else {
            console.error("❌ Crypto test failed: Decrypted text doesn't match original.");
        }
    } catch (err) {
        console.error("❌ Crypto test error:", err);
    }
}

testCrypto();
