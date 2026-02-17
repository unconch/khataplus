import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getWebAuthnRegistrationOptions } from '@/lib/webauthn';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const options = await getWebAuthnRegistrationOptions(session.userId, session.email || "");

        // Store challenge for verification
        (await cookies()).set('reg_challenge', options.challenge, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60000 // 1 minute
        });

        return NextResponse.json(options);
    } catch (error: any) {
        console.error('[WebAuthn/Register/Options] Error:', error.message);
        return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 });
    }
}
