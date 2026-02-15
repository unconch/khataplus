import { createClient } from '@supabase/supabase-js';

// Note: SUPABASE_SERVICE_ROLE_KEY should only be used in server-side contexts
// and never exposed to the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    // We don't throw immediately to allow build time, but runtime usage will fail if missing
    console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Admin client will not funciton.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
