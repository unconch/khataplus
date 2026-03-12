import { Redis } from "@upstash/redis"

let redisClient: Redis | null | undefined

function getRedis() {
    if (redisClient !== undefined) return redisClient
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
        console.warn("[RateLimit] Missing Upstash Redis env vars. Rate limiting disabled.")
        redisClient = null
        return redisClient
    }
    redisClient = new Redis({ url, token })
    return redisClient
}

export class RateLimitError extends Error {
    status = 429
    retryAfterMs: number

    constructor(message: string, retryAfterMs: number) {
        super(message)
        this.name = "RateLimitError"
        this.retryAfterMs = retryAfterMs
    }
}

/**
 * Fixed-window rate limiting using Upstash Redis.
 * Throws RateLimitError when the limit is exceeded.
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
    const redis = getRedis()
    if (!redis) return true

    const now = Date.now()
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
    const bucket = Math.floor(now / windowMs)
    const redisKey = `rl:${key}:${bucket}`

    const count = await redis.incr(redisKey)
    if (count === 1) {
        await redis.expire(redisKey, windowSeconds)
    }

    if (count > limit) {
        const retryAfterMs = (bucket + 1) * windowMs - now
        throw new RateLimitError("Rate limit exceeded", retryAfterMs)
    }

    return true
}

export function getIP(headers: Headers) {
    const forwardedFor = headers.get("x-forwarded-for")
    if (forwardedFor) return forwardedFor.split(",")[0].trim()
    const realIp = headers.get("x-real-ip")
    if (realIp) return realIp.trim()
    return "unknown"
}
