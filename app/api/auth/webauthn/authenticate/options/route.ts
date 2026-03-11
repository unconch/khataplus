import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getWebAuthnAuthenticationOptions } from '@/lib/webauthn';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const options = await getWebAuthnAuthenticationOptions(session.userId);

        // Store challenge for verification
        (await cookies()).set('auth_challenge', options.challenge, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60000 // 1 minute
        });

        return NextResponse.json(options);
    } catch (error: any) {
        console.error('[WebAuthn/Authenticate/Options] Error:', error.message);
        return NextResponse.json({ error: 'Failed to generate authentication options' }, { status: 500 });
    }
}
