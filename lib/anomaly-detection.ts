import { Redis } from '@upstash/redis'
import { audit } from './security'

const redis = Redis.fromEnv()
const DOWNLOAD_LIMIT = 10 // Max downloads per minute before alert
const WINDOW_SECONDS = 60

/**
 * Anomaly Detection Module
 * Monitors for suspicious patterns like bulk data exfiltration (ASVS Level 3).
 */

export async function trackDataExport(userId: string, orgId: string, entity: string) {
    const key = `anomaly:exports:${userId}:${orgId}`

    // 1. Increment the atomic counter in Redis
    const count = await redis.incr(key)

    // 2. Set expiration on first increment
    if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS)
    }

    // 3. Check for anomaly (High-frequency downloads)
    if (count > DOWNLOAD_LIMIT) {
        console.warn(`[Anomaly] Bulk export detected! User: ${userId}, Count: ${count}`);

        // 4. Log a high-severity alert in the audit ledger
        await audit(
            "SECURITY_ALERT_BULK_EXPORT",
            "system",
            userId,
            {
                severity: "HIGH",
                message: `Bulk data exfiltration detected. ${count} downloads in 60s.`,
                threshold: DOWNLOAD_LIMIT,
                actualCount: count,
                entityType: entity
            },
            orgId
        )

        return { flagged: true, count }
    }

    return { flagged: false, count }
}
