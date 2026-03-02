import { neon } from '@neondatabase/serverless';
// Load env vars for standalone execution only in Node context
if (
    typeof process !== 'undefined' &&
    process.env.NEXT_RUNTIME !== 'edge' &&
    process.env.VERCEL !== '1' &&
    process.env.NODE_ENV !== 'production'
) {
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

const normalizeConnString = (url: string) => {
    const sanitized = sanitizeConnString(url);
    try {
        const parsed = new URL(sanitized);
        if (
            (parsed.protocol === "postgres:" || parsed.protocol === "postgresql:") &&
            parsed.searchParams.has("channel_binding")
        ) {
            parsed.searchParams.delete("channel_binding");
        }
        return parsed.toString();
    } catch {
        return sanitized;
    }
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env.local');
}

export const sql = neon(normalizeConnString(process.env.DATABASE_URL));
