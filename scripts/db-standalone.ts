
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env.local');
}

export const sql = neon(process.env.DATABASE_URL);
