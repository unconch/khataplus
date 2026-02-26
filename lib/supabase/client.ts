import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Avoid navigator.locks race/abort noise in dev and single-tab usage.
                lock: async (_name: string, _timeout: number, fn: () => Promise<any>) => await fn(),
                // Prevent aggressive background refresh loops in unstable local networks.
                autoRefreshToken: false,
            },
        }
    )
}
