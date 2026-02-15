
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = Buffer.alloc(32); // Zero key for testing
const IV = crypto.randomBytes(12);

function encrypt(text: string, aad?: string) {
    const cipher = crypto.createCipheriv(ALGO, KEY, IV);
    if (aad) {
        console.log(`Encrypting with AAD: ${aad}`);
        cipher.setAAD(Buffer.from(aad));
    }
    let enc = cipher.update(text, 'utf8', 'base64');
    enc += cipher.final('base64');
    const tag = cipher.getAuthTag();
    return { enc, tag, iv: IV };
}

function decrypt(enc: string, tag: Buffer, iv: Buffer, aad?: string) {
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    if (aad) {
        console.log(`Decrypting with AAD: ${aad}`);
        decipher.setAAD(Buffer.from(aad));
    }
    decipher.setAuthTag(tag);
    let dec = decipher.update(enc, 'base64', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

try {
    console.log("--- DEBUG START ---");
    const { enc, tag, iv } = encrypt("hello", "secret_context");
    console.log(`Tag: ${tag.toString('hex')}`);

    // Try decrypting with SAME context
    try {
        const dec = decrypt(enc, tag, iv, "secret_context");
        console.log(`Same context decrypt: ${dec} (SUCCESS)`);
    } catch (e: any) {
        console.log(`Same context decrypt FAILED: ${e.message}`);
    }

    // Try decrypting with WRONG context
    try {
        decrypt(enc, tag, iv, "wrong_context");
        console.log(`Wrong context decrypt: SUCCESS (BAD!)`);
    } catch (e: any) {
        console.log(`Wrong context decrypt FAILED: ${e.message} (GOOD)`);
    }

    // Try decrypting with NO context
    try {
        decrypt(enc, tag, iv);
        console.log(`No context decrypt: SUCCESS (BAD!)`);
    } catch (e: any) {
        console.log(`No context decrypt FAILED: ${e.message} (GOOD)`);
    }
    console.log("--- DEBUG END ---");

} catch (e) {
    console.error(e);
}
