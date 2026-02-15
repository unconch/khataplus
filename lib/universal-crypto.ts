/**
 * Universal Crypto Utilities
 * Works in Node.js and Edge Runtime.
 */

/**
 * Generates a random hex string of given length in bytes.
 * Uses globalThis.crypto which is available in both Node (16+) and Edge.
 */
export function randomHex(bytes: number): string {
    const array = new Uint8Array(bytes);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Generates a random UUID.
 * Uses globalThis.crypto.randomUUID()
 */
export function generateUUID(): string {
    return globalThis.crypto.randomUUID();
}
