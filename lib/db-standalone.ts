import { neon } from '@neondatabase/serverless';
// Load env vars for standalone execution only in Node context
if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    try {
        const dotenv = require('dotenv');
        dotenv.config({ path: '.env.local' });
    } catch (e) {
        // dotenv might not be available in all contexts, ignore
    }
}

const sanitizeConnString = (url: string) => {
    if (!url) return url;
    let sanitized = url.trim();
    if (sanitized.startsWith("psql '") && sanitized.endsWith("'")) {
        sanitized = sanitized.substring(6, sanitized.length - 1);
    } else if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
        sanitized = sanitized.substring(1, sanitized.length - 1);
    }
    return sanitized;
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env.local');
}

export const sql = neon(sanitizeConnString(process.env.DATABASE_URL));
