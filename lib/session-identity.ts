import "server-only"

import { createHash } from "crypto"

export function createSessionFingerprint(source: string | null | undefined) {
  const value = String(source || "").trim()
  if (!value) return ""

  return createHash("sha256").update(value).digest("hex").slice(0, 24)
}
