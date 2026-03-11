import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session-server';
import { getWebAuthnRegistrationOptions } from '@/lib/webauthn';
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

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { rpID } = resolveWebAuthnContext(request)
        const options = await getWebAuthnRegistrationOptions(session.userId, session.email || "", rpID);

        // Store challenge for verification
        (await cookies()).set('reg_challenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            path: "/",
            maxAge: 60 * 10
        });

        return NextResponse.json(options);
    } catch (error: any) {
        console.error('[WebAuthn/Register/Options] Error:', error.message);
        return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 });
    }
}
