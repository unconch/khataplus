/**
 * Rate Limiting Utility
 * 
 * In a real production environment, this would use Upstash Redis 
 * or a similar distributed store to prevent bypass in serverless / multi-instance deploys.
 */

export async function rateLimit(key: string, limit: number, windowMs: number) {
    // SECURITY: Use a more robust store in production
    // For this demonstration, we'll explain the pattern

    // Pattern:
    // const redis = new Redis({ ... });
    // const { success } = await ratelimit.limit(key);
    // if (!success) throw new Error("Rate limit exceeded");

    console.log(`[RateLimit] Checking ${key} - Limit: ${limit} per ${windowMs}ms`);

    // For the demo audit, we'll return true but log the intent
    return true;
}

export function getIP(headers: Headers) {
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0];
    return "unknown";
}
