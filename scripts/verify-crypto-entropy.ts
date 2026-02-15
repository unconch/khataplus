
import { encrypt, decrypt, secureCompare } from '../lib/crypto';
import crypto from 'crypto';

async function runTests() {
    console.log("🔒 Starting Crypto & Entropy Verification...\n");

    let passes = 0;
    let fails = 0;

    function assert(condition: boolean, msg: string) {
        if (condition) {
            console.log(`✅ PASS: ${msg}`);
            passes++;
        } else {
            console.error(`❌ FAIL: ${msg}`);
            fails++;
        }
    }

    // TEST 1: Basic Encryption/Decryption
    try {
        const plaintext = "Secret Data";
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        assert(decrypted === plaintext, "Basic encryption round-trip");
    } catch (e) {
        console.error(e);
        assert(false, "Basic encryption failed");
    }

    // TEST 2: AAD Binding (Contextual Integrity)
    try {
        const plaintext = "Tenant A Data";
        const orgA = "org_a_uuid";
        const orgB = "org_b_uuid";

        // Encrypt with Org A context
        const encryptedWithA = encrypt(plaintext, orgA);

        // Decrypt with Org A context (Should succeed)
        try {
            const decryptedWithA = decrypt(encryptedWithA, orgA);
            assert(decryptedWithA === plaintext, "AAD Decryption with correct context");
        } catch (e: any) {
            console.error("Legal decrypt failed:", e.message);
            assert(false, "AAD Decryption with correct context failed");
        }

        // Decrypt with Org B context (Should FAIL)
        try {
            decrypt(encryptedWithA, orgB);
            assert(false, "AAD Decryption with WRONG context should have failed (it succeeded!)");
        } catch (e: any) {
            // Check broadly for failure
            const passed = true;
            // Logging purely for verification
            // console.log("Caught expected error:", e.message);
            assert(passed, "AAD Decryption with WRONG context correctly failed");
        }

        // Decrypt with NO context (Should FAIL)
        try {
            decrypt(encryptedWithA);
            assert(false, "AAD Decryption with MISSING context should have failed (it succeeded!)");
        } catch (e: any) {
            const passed = true;
            assert(passed, "AAD Decryption with MISSING context correctly failed");
        }

    } catch (e) {
        console.error(e);
        assert(false, "AAD tests crashed");
    }

    // TEST 3: Entropy Source Check
    try {
        const r1 = crypto.randomBytes(4).toString('hex');
        const r2 = crypto.randomBytes(4).toString('hex');
        assert(r1 !== r2, `Entropy Check: ${r1} !== ${r2}`);
        assert(r1.length === 8, "Hex output length correct");
    } catch (e) {
        assert(false, "Crypto randomness generation failed");
    }

    // TEST 4: Constant-Time Comparison
    try {
        const secret = "super_secret_role";
        const entry = "super_secret_role";
        const wrong = "super_secret_fail";

        assert(secureCompare(secret, entry) === true, "Secure compare match");
        assert(secureCompare(secret, wrong) === false, "Secure compare mismatch");

        // Length mismatch
        assert(secureCompare(secret, "short") === false, "Secure compare length mismatch");
    } catch (e) {
        console.error(e);
        assert(false, "Secure comparison failed");
    }

    console.log(`\nResults: ${passes} Passed, ${fails} Failed`);
    if (fails > 0) process.exit(1);
    process.exit(0);
}

runTests();
