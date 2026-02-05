/**
 * Neon Database connection client
 * Enforced to be server-side only for security.
 */
import 'server-only';
import { neon } from '@neondatabase/serverless';

let sqlInstance: any = null;

export const getSql = () => {
    if (!sqlInstance) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined. Ensure it is set in .env.local');
        }
        console.log('[DB] Initializing Neon connection...');
        sqlInstance = neon(process.env.DATABASE_URL);
    }
    return sqlInstance;
};

// For convenience, but use carefully
export const sql = (...args: any[]) => {
    const s = getSql();
    // Use apply/call if it's a tagged template, or just pass through
    // @ts-ignore
    return s(...args);
};
