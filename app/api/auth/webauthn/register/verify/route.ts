import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('reg_challenge');
    cookieStore.delete('reg_context');
    return NextResponse.json({ error: 'WebAuthn registration is disabled.' }, { status: 410 });
}
