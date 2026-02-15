import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { sql } from './db';
import { getSession } from './session';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const RP_NAME = 'KhataPlus';
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

export async function getWebAuthnRegistrationOptions(userId: string, userEmail: string) {
    // Fetch existing credentials to prevent re-registration of same authenticator
    const userCredentials = await sql`
        SELECT credential_id FROM webauthn_credentials WHERE user_id = ${userId}
    `;

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: Buffer.from(userId),
        userName: userEmail,
        attestationType: 'none',
        excludeCredentials: userCredentials.map((cred: any) => ({
            id: cred.credential_id,
            type: 'public-key',
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'required',
            authenticatorAttachment: 'platform',
        },
    });

    return options;
}

export async function verifyWebAuthnRegistration(
    userId: string,
    body: any,
    expectedChallenge: string
) {
    const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;

        // Save credential to DB
        await sql`
            INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter)
            VALUES (${userId}, ${credential.id}, ${Buffer.from(credential.publicKey)}, ${credential.counter})
        `;
    }

    return verification;
}

export async function getWebAuthnAuthenticationOptions(userId: string) {
    const userCredentials = await sql`
        SELECT credential_id FROM webauthn_credentials WHERE user_id = ${userId}
    `;

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: userCredentials.map((cred: any) => ({
            id: cred.credential_id,
            type: 'public-key',
        })),
        userVerification: 'required',
    });

    return options;
}

export async function verifyWebAuthnAuthentication(
    userId: string,
    body: any,
    expectedChallenge: string
) {
    const credResult = await sql`
        SELECT credential_id, public_key, counter, transports FROM webauthn_credentials 
        WHERE user_id = ${userId} AND credential_id = ${body.id}
    `;

    if (credResult.length === 0) {
        throw new Error('Credential not found');
    }

    const dbCredential = credResult[0];

    const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
            id: dbCredential.credential_id,
            publicKey: dbCredential.public_key,
            counter: Number(dbCredential.counter),
            transports: dbCredential.transports,
        },
    });

    if (verification.verified) {
        // Update counter
        await sql`
            UPDATE webauthn_credentials 
            SET counter = ${verification.authenticationInfo.newCounter}, last_used_at = NOW()
            WHERE credential_id = ${body.id}
        `;
    }

    return verification;
}
