import { Redis } from '@upstash/redis'


let redisClient: Redis | null = null;

function getRedis() {
    if (redisClient) return redisClient;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        redisClient = new Redis({ url, token });
        return redisClient;
    }
    console.warn("[SessionGovernance] Missing Upstash Redis env vars. Session checks will be skipped.");
    return null;
}

const MAX_CONCURRENT_SESSIONS = 3

/**
 * Session Governance Module
 * Enforces concurrent session limits and revocation logic.
 */

/**
 * Tracks a new session for a user.
 * If the limit is exceeded, the oldest session is flagged for revocation.
 */
export async function registerSession(userId: string, sessionId: string) {
    const redis = getRedis();
    if (!redis) return;

    const key = `user:sessions:${userId}`

    // Add new session ID to the set
    await redis.sadd(key, sessionId)

    // Check count
    const sessions = await redis.smembers(key)
    if (sessions.length > MAX_CONCURRENT_SESSIONS) {
        // Simple logic: remove one if over limit. 
        // In a real system, we might use a sorted set by timestamp.
        const sessionToRevoke = sessions[0]
        await redis.srem(key, sessionToRevoke)
        await redis.set(`revoked:session:${sessionToRevoke}`, 'true', { ex: 3600 * 24 })
    }
}

/**
 * Marks all current sessions of a user as invalid (forced logout).
 * Used on password or role change.
 */
export async function revokeAllSessions(userId: string) {
    const redis = getRedis();
    if (!redis) return;

    const key = `user:sessions:${userId}`
    const sessions = await redis.smembers(key)

    for (const sessionId of sessions) {
        await redis.set(`revoked:session:${sessionId}`, 'true', { ex: 3600 * 24 })
    }

    await redis.del(key)
    // Also set a minimum 'iat' (issued at) time for new sessions
    await redis.set(`user:min_iat:${userId}`, Math.floor(Date.now() / 1000))
}

/**
 * Checks if a session is valid and not revoked.
 */
export async function isSessionValid(userId: string, sessionId: string, iat?: number): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return true; // Fail open if Redis is down/missing

    // 1. Check if explicitly revoked
    const isRevoked = await redis.get(`revoked:session:${sessionId}`)
    if (isRevoked) return false

    // 2. Check if issued before a mandatory logout event (password change)
    if (iat) {
        const minIat = await redis.get<number>(`user:min_iat:${userId}`)
        if (minIat && iat < minIat) return false
    }

    return true
}
