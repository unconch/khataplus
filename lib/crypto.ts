import crypto from 'crypto';

/**
 * Platinum Security Crypto Module
 * 
 * Algorithm: AES-256-GCM
 * Key Size: 32 bytes (256 bits)
 * IV Size: 12 bytes (96 bits) - Mandatory for GCM
 * Format: JSON envelope { v: 'v1', iv, tag, data } (all base64)
 */

// Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits - standard for GCM
const KEY_LENGTH = 32; // 256 bits

// Interface for the storage format
interface EncryptedPayload {
    v: string;    // Version for key rotation ('v1')
    iv: string;   // Initialization Vector (Base64)
    tag: string;  // Authentication Tag (Base64)
    data: string; // Encrypted Ciphertext (Base64)
}

// --------------------------------------------------------------------------
// Key Loader - Validates environment variable on module load
// --------------------------------------------------------------------------
function loadKey(): Buffer {
    // Check if we are in a build environment to prevent crash during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return Buffer.alloc(32);
    }

    const keyHex = process.env.ENCRYPTION_KEY;

    if (!keyHex) {
        throw new Error('CRITICAL: ENCRYPTION_KEY is not defined in environment variables.');
    }

    // Hex string must be exactly 64 characters (32 bytes)
    if (keyHex.length !== 64) {
        throw new Error(`CRITICAL: ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Received ${keyHex.length} chars.`);
    }

    const key = Buffer.from(keyHex, 'hex');

    // Double check the buffer length
    if (key.length !== KEY_LENGTH) {
        throw new Error('CRITICAL: Invalid ENCRYPTION_KEY length after decoding.');
    }

    return key;
}

// Load key once (lazy loading could be safer if env vars change, but const is better for perf)
// We wrap it to allow importing this file even if env is missing during dev (e.g. for generating keys)
let _key: Buffer | null = null;
const getKey = () => {
    if (!_key) _key = loadKey();
    return _key;
};


// --------------------------------------------------------------------------
// Encryption
// --------------------------------------------------------------------------
export function encrypt(text: string): string {
    const key = getKey();

    // 1. Generate unique 12-byte IV (Never reuse IV with same key!)
    const iv = crypto.randomBytes(IV_LENGTH);

    // 2. Create Cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // 3. Encrypt
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // 4. Get Auth Tag (Vital for integrity)
    const tag = cipher.getAuthTag();

    // 5. Construct Payload
    const payload: EncryptedPayload = {
        v: 'v1',
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted
    };

    // 6. Serialize to JSON string
    return JSON.stringify(payload);
}


// --------------------------------------------------------------------------
// Decryption
// --------------------------------------------------------------------------
export function decrypt(encryptedJson: string): string {
    const key = getKey();

    try {
        // 1. Parse JSON
        const payload: EncryptedPayload = JSON.parse(encryptedJson);

        // 2. Validate Version
        if (payload.v !== 'v1') {
            throw new Error(`Unsupported encryption version: ${payload.v}`);
        }

        // 3. Convert Base64 to Buffers
        const iv = Buffer.from(payload.iv, 'base64');
        const tag = Buffer.from(payload.tag, 'base64');
        const encryptedText = payload.data; // passed as string to decipher

        // 4. Validate IV length (Critical for GCM)
        if (iv.length !== IV_LENGTH) {
            throw new Error('Invalid IV length');
        }

        // 5. Create Decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        // 6. Set Auth Tag (Must do this before final)
        decipher.setAuthTag(tag);

        // 7. Decrypt
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;

    } catch (error: any) {
        // Handle explicit integrity errors
        if (error.code === 'ERR_OSSL_EVP_BAD_DECRYPT') {
            throw new Error('Integrity Check Failed: Data or Tag has been tampered with.');
        }

        // Mask other complex errors to avoid leaking internal details
        throw new Error(`Decryption failed: ${error.message}`);
    }
}
