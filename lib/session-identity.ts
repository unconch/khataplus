import "server-only"

import { createHash } from "crypto"

export function createSessionFingerprint(source: string | null | undefined, context?: string | null) {
  const value = String(source || "").trim()
  const ctx = String(context || "").trim()
  if (!value) return ""

  // Incorporate context into the hash for stronger device/agent binding
  return createHash("sha256").update(`${value}:${ctx}`).digest("hex").slice(0, 24)
}
