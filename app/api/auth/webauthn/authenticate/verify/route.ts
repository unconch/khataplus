import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verifyWebAuthnAuthentication } from '@/lib/webauthn';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get('auth_challenge')?.value;

    if (!expectedChallenge) {
        return NextResponse.json({ error: 'Missing challenge' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const verification = await verifyWebAuthnAuthentication(session.userId, body, expectedChallenge);

        if (verification.verified) {
            // SECURITY: Set a server-side verified biometric bit in the session/cookie
            cookieStore.set('biometric_verified', 'true', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 3600 // 1 hour
            });

            // Clean up challenge cookie
            cookieStore.delete('auth_challenge');
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[WebAuthn/Authenticate/Verify] Error:', error.message);
        return NextResponse.json({ error: 'Failed to verify authentication' }, { status: 500 });
    }
}
