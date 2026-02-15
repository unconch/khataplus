import { createClient } from '@supabase/supabase-js';

// Note: SUPABASE_SERVICE_ROLE_KEY should only be used in server-side contexts
// and never exposed to the client.

// Ensure we have strings, even if empty, to avoid crash on destructuring or passing to createClient
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : (() => {
        console.warn("Supabase Admin client not initialized: Missing env vars.");
        return null as any;
    })();
