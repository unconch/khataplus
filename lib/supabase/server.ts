import { createServerClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { cookies, headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config"
import { getSupabaseCookieOptions, normalizeHostname } from "@/lib/supabase/cookies"

function getCookieHostnameFromHeaders(headerStore: Awaited<ReturnType<typeof headers>>) {
  return normalizeHostname(
    headerStore.get("x-forwarded-host") || headerStore.get("host") || undefined
  )
}

export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieOptions = getSupabaseCookieOptions(getCookieHostnameFromHeaders(headerStore))

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...cookieOptions, ...options })
          })
        } catch {
          // Server Components cannot always write cookies during render.
          // Proxy-based refresh keeps the session valid for those requests.
        }
      },
    },
  })
}

export type SessionRefreshResult = {
  error: Error | null
  response: NextResponse
  user: User | null
}

export async function updateSession(request: NextRequest): Promise<SessionRefreshResult> {
  const cookieOptions = getSupabaseCookieOptions(request.nextUrl.hostname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { ...cookieOptions, ...options })
        })
      },
    },
  })

  const { data, error } = await supabase.auth.getUser()

  return {
    error: error ? new Error(error.message) : null,
    response,
    user: data.user ?? null,
  }
}
