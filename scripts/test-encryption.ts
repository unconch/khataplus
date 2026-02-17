
import { encrypt, decrypt } from '../lib/crypto';
import crypto from 'crypto';

// --------------------------------------------------------------------------
// MOCK ENV for Testing
// --------------------------------------------------------------------------
// We generate a valid random key for this test session
const TEST_KEY = crypto.randomBytes(32).toString('hex');
process.env.ENCRYPTION_KEY = TEST_KEY;

console.log('---------------------------------------------------');
console.log('🔐 KhataPlus Crypto Security Test');
console.log('---------------------------------------------------');
console.log('Test Key (Hex):', TEST_KEY);
console.log('---------------------------------------------------\n');

async function testSuccess() {
    console.log('👉 Test 1: Standard Encrypt/Decrypt Cycle');
    const secret = "This is a super secret message 123!";

    try {
        const encrypted = await encrypt(secret);
        console.log('   [Encrypt] Output:', encrypted);

        const decrypted = await decrypt(encrypted);
        console.log('   [Decrypt] Output:', decrypted);

        if (decrypted === secret) {
            console.log('   ✅ PASS: Data matched');
        } else {
            console.error('   ❌ FAIL: Data mismatch');
            process.exit(1);
        }
    } catch (e) {
        console.error('   ❌ FAIL: Error thrown', e);
        process.exit(1);
    }
    console.log('');
}

async function testTampering() {
    console.log('👉 Test 2: Integrity/Tamper Check');
    const secret = "Don't touch this!";
    const encrypted = await encrypt(secret);
    const parsed = JSON.parse(encrypted);

    // Tamper with the data (change last char of base64)
    // We just flip the last character. If it was 'A', make it 'B'.
    const originalData = parsed.data;
    const tamperedData = originalData.substring(0, originalData.length - 1) + (originalData.endsWith('A') ? 'B' : 'A');

    parsed.data = tamperedData;
    const tamperedJson = JSON.stringify(parsed);

    console.log('   [Tamper] Modified ciphertext directly.');

    try {
        await decrypt(tamperedJson);
        console.error('   ❌ FAIL: Decryption should have failed but succeeded!');
        process.exit(1);
    } catch (e: any) {
        if (e.message.includes('Integrity Check Failed') || e.message.includes('Decryption failed')) {
            console.log('   ✅ PASS: Decryption correctly threw error:', e.message);
        } else {
            console.error('   ❌ FAIL: Wrong error message:', e.message);
            process.exit(1);
        }
    }
    console.log('');
}

async function run() {
    await testSuccess();
    await testTampering();
    console.log('---------------------------------------------------');
    console.log('🎉 All Encryption Tests Passed');
    console.log('---------------------------------------------------');
}

run();
