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

    if (!expectedChallenge) {
        return NextResponse.json({ error: 'Missing challenge' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { origin, rpID } = resolveWebAuthnContext(request)
        const verification = await verifyWebAuthnRegistration(session.userId, body, expectedChallenge, origin, rpID);

        if (verification.verified) {
            // Clean up challenge cookie
            cookieStore.delete('reg_challenge');
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[WebAuthn/Register/Verify] Error:', error.message);
        return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 });
    }
}
