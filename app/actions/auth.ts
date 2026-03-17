"use server"

import { createClient } from "@/lib/supabase/server"
import { ensureProfileSync, getRedirectPath } from "@/lib/auth/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function sendOtpAction(email: string, name?: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true, // Allow new users to sign up
      data: {
        full_name: name || "",
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function verifyOtpAction(email: string, token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  })

  if (error || !data.user) {
    return { error: error?.message || "Invalid verification code" }
  }

  const user = data.user
  const fullName = user.user_metadata?.full_name || ""

  // Atomic Profile Sync - ensure user exists in public.profiles
  try {
    await ensureProfileSync(user.id, user.email || email, fullName)
  } catch (syncErr: any) {
    // If profile sync fails, we still have a Supabase session, 
    // but the app might be unstable. We return error so the client can retry.
    return { error: syncErr.message || "Failed to sync account profile." }
  }

  // Determine redirection path
  const redirectUrl = await getRedirectPath(user.id)
  
  return { success: true, redirectUrl }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
