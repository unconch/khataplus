import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verifyWebAuthnRegistration } from '@/lib/webauthn';
import { cookies } from 'next/headers';

function resolveWebAuthnContext(request: NextRequest) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.trim()
    const forwardedHost = request.headers.get("x-forwarded-host")?.trim()
    const rawHost = forwardedHost || request.headers.get("host") || "localhost:3000"
    const host = rawHost.split(",")[0].trim()
    const rpID = host.replace(/:\d+$/, "")
    const protocol = forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    return { origin: `${protocol}://${host}`, rpID }
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get('reg_challenge')?.value;
    const contextRaw = cookieStore.get('reg_context')?.value;
    let expectedOrigin: string | undefined
    let expectedRPID: string | undefined
    if (contextRaw) {
        try {
            const parsed = JSON.parse(contextRaw)
            if (parsed && typeof parsed === "object") {
                if (typeof parsed.origin === "string") expectedOrigin = parsed.origin
                if (typeof parsed.rpID === "string") expectedRPID = parsed.rpID
            }
        } catch {
            // fall back to request context
        }
    }

    if (!expectedChallenge) {
        return NextResponse.json({ error: 'Missing challenge' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const fallback = resolveWebAuthnContext(request)
        const verification = await verifyWebAuthnRegistration(
            session.userId,
            body,
            expectedChallenge,
            expectedOrigin || fallback.origin,
            expectedRPID || fallback.rpID
        );

        if (verification.verified) {
            // Clean up challenge cookie
            cookieStore.delete('reg_challenge');
            cookieStore.delete('reg_context');
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[WebAuthn/Register/Verify] Error:', error.message);
        return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 });
    }
}
