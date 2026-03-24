import { NextResponse } from "next/server"
import crypto from "crypto"
import { sql } from "@/lib/db"
import { authorize, audit } from "@/lib/security"
import { rateLimit, getIP } from "@/lib/rate-limit"

function resolveRazorpayCredentials() {
    const mode = (process.env.RAZORPAY_MODE || "test").toLowerCase()

    if (mode === "live") {
        return {
            keyId: process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
        }
    }

    return {
        keyId: process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
    }
}

export async function POST(req: Request) {
    try {
        // Rate limit: 10 requests per minute per IP
        await rateLimit(`payment-verify:${getIP(req.headers)}`, 10, 60_000)

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orgId, plan, cycle } = await req.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orgId) {
            return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
        }

        // Auth: Verify caller owns this organization
        await authorize("Verify Payment", "owner", orgId)

        const { keySecret } = resolveRazorpayCredentials()
        if (!keySecret) {
            return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
        }

        // Verify signature using constant-time comparison to prevent timing attacks
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex")

        let isAuthentic = false
        try {
            isAuthentic = crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(razorpay_signature, 'hex')
            )
        } catch {
            // Buffer length mismatch — signature is invalid
            isAuthentic = false
        }

        if (!isAuthentic) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
        }

        // Update Organization Plan
        const expirationDate = new Date()
        if (cycle === 'yearly') expirationDate.setFullYear(expirationDate.getFullYear() + 1)
        else expirationDate.setMonth(expirationDate.getMonth() + 1)

        await sql`
      UPDATE organizations 
      SET plan_type = ${plan}, 
          subscription_status = 'active',
          plan_expires_at = ${expirationDate.toISOString()},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orgId}
    `

        // Log the transaction
        await sql`
      INSERT INTO platform_invoices (org_id, amount, status, plan_type, razorpay_payment_id)
      VALUES (${orgId}, 0, 'paid', ${plan}, ${razorpay_payment_id})
    `

        await audit("Payment: Verified & Plan Updated", "billing", orgId, { plan, cycle, paymentId: razorpay_payment_id }, orgId)

        return NextResponse.json({ success: true, message: "Payment verified successfully" })

    } catch (error: any) {
        if (error?.name === "RateLimitError") {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }
        console.error("[Razorpay/Verify] Error:", error.message)
        return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }
}
