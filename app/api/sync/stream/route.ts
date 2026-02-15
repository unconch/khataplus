import { NextRequest } from 'next/server';
import { subscribeToSync } from '@/lib/sync-notifier';
import { Redis } from '@upstash/redis'

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const redis = Redis.fromEnv();

/**
 * SSE Endpoint: /api/sync/stream
 * Implements KhataPlus SSE-Based Real-Time Sync Specification.
 * Compatible with Vercel Edge + Upstash Redis.
 */
export async function GET(req: NextRequest) {
    const orgId = req.nextUrl.searchParams.get('orgId');

    if (!orgId) {
        return new Response('orgId is required', { status: 400 });
    }

    // SECURITY HARDENING: Authorize SSE Stream (ASVS Level 3)
    // Prevent metadata leakage by verifying user membership in the organization
    const { getSession } = await import('@/lib/session');
    const session = await getSession();
    if (!session) {
        return new Response('Unauthorized: Session required', { status: 401 });
    }

    const { getUserOrganizations } = await import('@/lib/data/organizations');
    const userOrgs = await getUserOrganizations(session.user.id);
    const isMember = userOrgs.some(o => o.org_id === orgId);

    if (!isMember) {
        console.error(`[SSE/Auth] Unauthorized stream attempt for org: ${orgId} by user: ${session.user.id}`);
        return new Response('Forbidden: Access denied to this organization', { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: string, data: any) => {
                const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // 5.3 heartbeat (every 20 seconds)
            const heartbeatInterval = setInterval(() => {
                try {
                    sendEvent('heartbeat', {});
                } catch (e) { }
            }, 20000);

            // 5.1 & 9: Redis-backed sync detection
            // In a serverless/edge environment, we can't maintain a long-lived blocking Redis connection easily.
            // Instead, we poll the Redis key for this org every 3 seconds while the SSE stream is open.
            let lastKnownUpdate = "";

            const redisCheckInterval = setInterval(async () => {
                try {
                    const data = await redis.get(`sync:${orgId}`);
                    if (data && typeof data === 'object') {
                        const payload = data as any;
                        if (payload.updatedAt !== lastKnownUpdate) {
                            sendEvent('sync_required', payload);
                            lastKnownUpdate = payload.updatedAt;
                        }
                    }
                } catch (e) {
                    console.error("[SSE] Redis poll error:", e);
                }
            }, 3000);

            // Local instance subscription (if mutation happens on the same Edge instance)
            const unsubscribeLocal = subscribeToSync((payload) => {
                if (payload.companyId === orgId && payload.updatedAt !== lastKnownUpdate) {
                    sendEvent('sync_required', payload);
                    lastKnownUpdate = payload.updatedAt;
                }
            });

            // Cleanup
            req.signal.onabort = () => {
                clearInterval(heartbeatInterval);
                clearInterval(redisCheckInterval);
                unsubscribeLocal();
                try {
                    controller.close();
                } catch (e) { }
            };
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
