import { randomHex } from './universal-crypto';

/**
 * Platinum Security Crypto Module
 * 
 * Algorithm: AES-256-GCM
 * Key Size: 32 bytes (256 bits)
 * IV Size: 12 bytes (96 bits) - Mandatory for GCM
 * Format: JSON envelope { v: 'v2', iv, tag, data, aad? } (all base64)
 * Bindings: Strongly recommends AAD (Associated Authenticated Data) for context binding.
 */

// Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits - standard for GCM
const KEY_LENGTH = 32; // 256 bits

// Interface for the storage format
interface EncryptedPayload {
    v: string;    // Version for key rotation ('v2')
    iv: string;   // Initialization Vector (Base64)
    tag: string;  // Authentication Tag (Base64)
    data: string; // Encrypted Ciphertext (Base64)
    aad?: string; // Optional AAD (Base64) for verification
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
    if (!_key) {
        _key = loadKey();
    }
    return _key;
};


// --------------------------------------------------------------------------
// Encryption (Universal)
// --------------------------------------------------------------------------
export async function encrypt(text: string, aadContext?: string, keyOverride?: string | Buffer): Promise<string> {
    let keyBuffer: Buffer;
    if (keyOverride) {
        keyBuffer = Buffer.isBuffer(keyOverride) ? keyOverride : Buffer.from(keyOverride, 'hex');
        if (keyBuffer.length !== KEY_LENGTH) throw new Error('Invalid key length for encryption override');
    } else {
        keyBuffer = getKey();
    }

    // 1. Generate unique 12-byte IV
    const iv = Buffer.from(randomHex(IV_LENGTH), 'hex');

    // 2. Prepare Web Crypto Key
    const cryptoKey = await globalThis.crypto.subtle.importKey(
        'raw',
        new Uint8Array(keyBuffer),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    // 3. Set AAD context if provided
    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        tagLength: 128, // 16 bytes
    };
    if (aadContext) {
        algorithm.additionalData = new Uint8Array(Buffer.from(aadContext, 'utf8'));
    }

    // 4. Encrypt
    const dataBuffer = new Uint8Array(Buffer.from(text, 'utf8'));
    const encryptedRaw = await globalThis.crypto.subtle.encrypt(
        algorithm,
        cryptoKey,
        dataBuffer
    );

    const encryptedBuffer = Buffer.from(encryptedRaw);

    // In Web Crypto, the tag is appended to the ciphertext
    const tag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
    const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

    // 5. Construct Payload
    const payload: EncryptedPayload = {
        v: 'v2',
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: ciphertext.toString('base64'),
    };

    return JSON.stringify(payload);
}


// --------------------------------------------------------------------------
// Decryption (Universal)
// --------------------------------------------------------------------------
export async function decrypt(encryptedJson: string, aadContext?: string, keyOverride?: string | Buffer): Promise<string> {
    let keyBuffer: Buffer;
    if (keyOverride) {
        keyBuffer = Buffer.isBuffer(keyOverride) ? keyOverride : Buffer.from(keyOverride, 'hex');
        if (keyBuffer.length !== KEY_LENGTH) throw new Error('Invalid key length for decryption override');
    } else {
        keyBuffer = getKey();
    }

    try {
        // 1. Parse JSON
        const payload: EncryptedPayload = JSON.parse(encryptedJson);

        if (payload.v !== 'v1' && payload.v !== 'v2') {
            throw new Error(`Unsupported encryption version: ${payload.v}`);
        }

        // 2. Convert Base64 back to Buffers
        const iv = Buffer.from(payload.iv, 'base64');
        const tag = Buffer.from(payload.tag, 'base64');
        const ciphertext = Buffer.from(payload.data, 'base64');

        if (iv.length !== IV_LENGTH) throw new Error('Invalid IV length');

        // 3. Prepare Web Crypto Key
        const cryptoKey = await globalThis.crypto.subtle.importKey(
            'raw',
            new Uint8Array(keyBuffer),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        // 4. Reconstruct the encrypted buffer (ciphertext + tag) for Web Crypto
        const encryptedBuffer = Buffer.concat([ciphertext, tag]);

        // 5. Set AAD context
        const algorithm: AesGcmParams = {
            name: 'AES-GCM',
            iv: new Uint8Array(iv),
            tagLength: 128,
        };
        if (payload.v === 'v2' && aadContext) {
            algorithm.additionalData = new Uint8Array(Buffer.from(aadContext, 'utf8'));
        }

        // 6. Decrypt
        const decryptedRaw = await globalThis.crypto.subtle.decrypt(
            algorithm,
            cryptoKey,
            new Uint8Array(encryptedBuffer)
        );

        return Buffer.from(decryptedRaw).toString('utf8');

    } catch (error: any) {
        if (error.name === 'OperationError') {
            throw new Error('Integrity Check Failed: Data or Tag has been tampered with (or Context/AAD mismatch).');
        }
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Constant-time comparison for secrets to prevent timing attacks.
 */
export function secureCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        return false;
    }

    // Constant-time comparison
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
        result |= bufA[i] ^ bufB[i];
    }
    return result === 0;
}
