import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ error: 'WebAuthn registration is disabled.' }, { status: 410 });
}
