import { NextResponse } from "next/server"
import crypto from "crypto"
import { sql } from "@/lib/db"
import { audit } from "@/lib/security"

function resolveRazorpayCredentials() {
    const mode = (process.env.RAZORPAY_MODE || "").toLowerCase()
    if (mode === "test") {
        return {
            keyId: process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
        }
    }
    if (mode === "live") {
        return {
            keyId: process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
        }
    }
    return {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
    }
}

export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orgId, plan, cycle } = await req.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
        }

        const { keySecret } = resolveRazorpayCredentials()
        if (!keySecret) {
            return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex")

        const isAuthentic = expectedSignature === razorpay_signature

        if (!isAuthentic) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
        }

        // Update Organization Plan
        // In a real app, you'd calculate expiration based on current date + cycle
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
        console.error("[Razorpay/Verify] Error:", error.message)
        return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }
}
