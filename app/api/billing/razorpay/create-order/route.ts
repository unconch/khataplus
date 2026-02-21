import { NextResponse } from "next/server"

const PRICING_PAISE: Record<string, { monthly: number; yearly: number }> = {
  keep: { monthly: 49_00, yearly: 399_00 },
  starter: { monthly: 179_00, yearly: 1499_00 },
  pro: { monthly: 449_00, yearly: 3999_00 },
  business: { monthly: 899_00, yearly: 7999_00 },
}

function resolveRazorpayCredentials() {
  const mode = (process.env.RAZORPAY_MODE || "").toLowerCase()

  if (mode === "test") {
    return {
      keyId: process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
      mode: "test" as const,
    }
  }

  if (mode === "live") {
    return {
      keyId: process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
      mode: "live" as const,
    }
  }

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    mode: "default" as const,
  }
}

export async function POST(req: Request) {
  const { keyId, keySecret } = resolveRazorpayCredentials()

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 })
  }

  let body: { plan?: string; cycle?: "monthly" | "yearly" } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { plan, cycle } = body
  if (!plan || !cycle || (cycle !== "monthly" && cycle !== "yearly")) {
    return NextResponse.json({ error: "plan and cycle are required" }, { status: 400 })
  }

  const planPricing = PRICING_PAISE[plan]
  if (!planPricing) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 })
  }

  const amount = planPricing[cycle]

  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")

  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `kp_${plan}_${Date.now()}`,
      notes: { plan, cycle },
    }),
  })

  const data = await orderRes.json().catch(() => ({}))

  if (!orderRes.ok) {
    const message = data?.error?.description || "Failed to create order"
    return NextResponse.json({ error: message }, { status: 502 })
  }

  return NextResponse.json({
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId,
  })
}
