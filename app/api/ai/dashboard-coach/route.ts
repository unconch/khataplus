import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { groqChat, groqWithRetry, isGroqAvailable, parseGroqJSON } from "@/lib/groq"

type CoachPayload = {
  revenue?: number
  profit?: number
  receivables?: number
  lowStockCount?: number
  inventoryCount?: number
}

type CoachResponse = {
  headline: string
  action: string
  rationale: string
}

function fallbackCoach(data: CoachPayload): CoachResponse {
  const receivables = Number(data.receivables || 0)
  const lowStock = Number(data.lowStockCount || 0)
  const profit = Number(data.profit || 0)

  if (receivables > 0) {
    return {
      headline: "Recover receivables today",
      action: "Send payment follow-ups to top pending khata customers.",
      rationale: "This improves cash flow faster than adding new sales effort.",
    }
  }
  if (lowStock > 0) {
    return {
      headline: "Restock critical items",
      action: "Prioritize low-stock SKUs with highest recent sales velocity.",
      rationale: "Prevents avoidable stockout-driven revenue loss.",
    }
  }
  if (profit < 0) {
    return {
      headline: "Margin needs attention",
      action: "Review top 5 low-margin products and adjust pricing or buy rates.",
      rationale: "Small pricing fixes can recover monthly profitability quickly.",
    }
  }
  return {
    headline: "Performance is stable",
    action: "Close today with a quick stock and receivables review.",
    rationale: "Daily consistency compounds into stronger weekly outcomes.",
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json().catch(() => ({}))) as CoachPayload
    const fallback = fallbackCoach(payload)

    if (!isGroqAvailable()) {
      return NextResponse.json({ ...fallback, source: "rules" })
    }

    const prompt = `You are an assistant for Indian SMB operations.
Given these metrics, return strict JSON with keys: headline, action, rationale.
Constraints:
- headline <= 8 words
- action <= 16 words
- rationale <= 18 words
- Practical, specific, and non-generic.

Metrics:
- revenue: ${Number(payload.revenue || 0)}
- profit: ${Number(payload.profit || 0)}
- receivables: ${Number(payload.receivables || 0)}
- lowStockCount: ${Number(payload.lowStockCount || 0)}
- inventoryCount: ${Number(payload.inventoryCount || 0)}`

    const text = await groqWithRetry(() => groqChat(prompt, "llama-3.3-70b-versatile", 0.1), 2)
    const parsed = parseGroqJSON<CoachResponse>(text, fallback).data

    return NextResponse.json({
      headline: parsed.headline || fallback.headline,
      action: parsed.action || fallback.action,
      rationale: parsed.rationale || fallback.rationale,
      source: "groq",
    })
  } catch (error) {
    console.error("[dashboard-coach] failed:", error)
    return NextResponse.json({ error: "Failed to generate coach insight" }, { status: 500 })
  }
}

