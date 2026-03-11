import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createOrganization } from "@/lib/data/organizations"
import { getUserOrganizationsResolved } from "@/lib/data/auth"
import { getProfile, upsertProfile } from "@/lib/data/profiles"
import { z } from "zod"

const organizationSchema = z.object({
    userName: z.string()
        .min(2, "Please enter your full name")
        .max(50, "Name is too long")
        .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, dots, and hyphens"),
    name: z.string()
        .min(3, "Business name must be at least 3 characters")
        .max(100, "Business name is too long")
        .regex(/[a-zA-Z0-9]{3,}/, "Business name must contain at least 3 alphanumeric characters")
        .refine(val => val.toLowerCase() !== "demo", { message: "The name 'demo' is reserved." }),
    gstin: z.string()
        .optional()
        .refine(val => !val || val.trim() === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.trim().toUpperCase()), {
            message: "Invalid GSTIN format."
        }),
    address: z.string().min(5, "Address must be detailed (min 5 chars)"),
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
})

export async function POST(request: Request) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()

        // Strict Server-Side Validation
        const validationResult = organizationSchema.safeParse(body);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0].message;
            return NextResponse.json({ error: firstError }, { status: 400 })
        }

        const { name, userName, gstin, address, phone } = validationResult.data;

        // If userName or phone is provided, update the user's profile
        if (userName || phone) {
            const profile = await getProfile(userId);
            if (profile) {
                await upsertProfile({
                    ...profile,
                    name: userName ? userName.trim() : (profile.name ?? undefined),
                    phone: phone ? phone.trim() : (profile.phone ?? undefined)
                });
            }
        }

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json({ error: "Business name must be at least 2 characters" }, { status: 400 })
        }

        const org = await createOrganization(name.trim(), userId, {
            gstin: gstin?.trim() || undefined,
            address: address?.trim() || undefined,
            phone: phone?.trim() || undefined
        })

        return NextResponse.json(org)
    } catch (e: any) {
        console.error("Create org error:", e)
        return NextResponse.json({ error: e.message || "Failed to create organization" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Use resolved lookup to avoid stale membership reads immediately after org creation.
        const orgs = await getUserOrganizationsResolved(userId)

        return NextResponse.json(orgs)
    } catch (e: any) {
        console.error("Get orgs error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
