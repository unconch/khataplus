import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function addBiometricColumn() {
    try {
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_required BOOLEAN DEFAULT false`;
        console.log('✅ biometric_required column added successfully');
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

addBiometricColumn();
