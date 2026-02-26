import "server-only"
import { cookies } from "next/headers"

export interface SessionStepUpClaims {
    authTime: number | null
    methods: string[]
    acr: string | null
}

function normalizeUnixSeconds(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        if (value > 1_000_000_000_000) return Math.floor(value / 1000);
        if (value > 0) return Math.floor(value);
        return null;
    }
    if (typeof value === "string" && value.trim()) {
        const num = Number(value);
        if (Number.isFinite(num)) {
            return normalizeUnixSeconds(num);
        }
    }
    return null;
}

function pickFirstString(values: unknown[]): string | null {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return null;
}

function normalizeMethods(values: unknown[]): string[] {
    const out = new Set<string>();
    for (const value of values) {
        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === "string" && item.trim()) {
                    out.add(item.trim().toLowerCase());
                }
            }
            continue;
        }
        if (typeof value === "string" && value.trim()) {
            out.add(value.trim().toLowerCase());
        }
    }
    return Array.from(out);
}

function extractStepUpClaims(raw: any): SessionStepUpClaims {
    const authTime = [
        raw?.token?.auth_time,
        raw?.session?.token?.auth_time,
        raw?.token?.claims?.auth_time,
        raw?.session?.claims?.auth_time,
        raw?.token?.iat,
        raw?.session?.token?.iat,
    ].map(normalizeUnixSeconds).find((v) => typeof v === "number") ?? null;

    const methods = normalizeMethods([
        raw?.token?.amr,
        raw?.session?.token?.amr,
        raw?.token?.claims?.amr,
        raw?.session?.claims?.amr,
        raw?.user?.amr,
    ]);

    const acr = pickFirstString([
        raw?.token?.acr,
        raw?.session?.token?.acr,
        raw?.token?.claims?.acr,
        raw?.session?.claims?.acr,
    ]);

    return { authTime, methods, acr };
}

function normalizeSession(raw: any) {
    const user = raw?.user || raw?.token?.user || raw?.session?.user || null
    const token = raw?.token || raw?.session?.token || {}

    const userId =
        user?.userId ||
        user?.sub ||
        token?.sub ||
        token?.userId ||
        null

    const email =
        user?.email ||
        token?.email ||
        null

    const name =
        user?.name ||
        user?.givenName ||
        token?.name ||
        token?.given_name ||
        null

    if (!userId) return null

    return { userId, email, name }
}

/**
 * Validates and retrieves the current Descope session.
 */
export async function getSession() {
    try {
        const { session: descopeSession } = await import("@descope/nextjs-sdk/server")
        const raw = await descopeSession()
        const parsed = normalizeSession(raw)

        if (!parsed) return null

        const cookieStore = await cookies()
        const isBiometricVerified = cookieStore.get("biometric_verified")?.value === "true"
        const stepUp = extractStepUpClaims(raw)

        return {
            user: {
                id: parsed.userId,
                email: parsed.email || undefined,
                name: parsed.name,
            },
            userId: parsed.userId,
            email: parsed.email || undefined,
            isBiometricVerified,
            stepUp,
        }
    } catch (e) {
        console.error("Descope session error:", e)
        return null
    }
}
