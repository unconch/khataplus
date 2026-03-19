export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
  }
  return value
}

export function getSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
  }
  return value
}

export function getSupabaseProxyUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL?.trim().replace(/\/$/, "") ||
    process.env.SUPABASE_PROXY_URL?.trim().replace(/\/$/, "") ||
    undefined
  )
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined
}
