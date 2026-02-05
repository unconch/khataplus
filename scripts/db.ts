
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

let sqlInstance: any = null;

export const getSql = () => {
    if (!sqlInstance) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined in .env.local');
        }
        sqlInstance = neon(process.env.DATABASE_URL);
    }
    return sqlInstance;
};

export const sql = (...args: any[]) => {
    const s = getSql();
    // @ts-ignore
    return s(...args);
};
