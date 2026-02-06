import 'server-only';
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Managed in-memory registry for SSE subscribers within THIS instance.
type SyncPayload = {
    companyId: string;
    entity: 'inventory' | 'sale' | 'customer' | 'report' | 'settings' | 'khata';
    updatedAt: string;
}

type SyncCallback = (payload: SyncPayload) => void;
const subscribers = new Set<SyncCallback>();

/**
 * Register a new SSE connection to receive notifications
 */
export function subscribeToSync(callback: SyncCallback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Trigger a sync event for all connected clients of a specific organization.
 * @param orgId The organization ID (companyId in spec)
 * @param entity The type of entity updated
 */
export async function triggerSync(orgId: string, entity: SyncPayload['entity']) {
    const payload: SyncPayload = {
        companyId: orgId,
        entity: entity,
        updatedAt: new Date().toISOString()
    };

    // 1. Notify local subscribers (if any in this same process/instance)
    subscribers.forEach(callback => callback(payload));

    // 2. Notify remote subscribers (via Upstash Redis)
    // We set a key with orgId. The SSE streams will poll or subscribe to this key.
    // Spec 9: Using Redis to fan out events.
    try {
        await redis.set(`sync:${orgId}`, JSON.stringify(payload), { ex: 60 }); // Expire in 60s
        console.log(`[Redis] Published sync for ${orgId}`);
    } catch (e) {
        console.error("[Redis] Failed to publish sync:", e);
    }
}
