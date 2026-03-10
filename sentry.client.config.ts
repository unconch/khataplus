import * as Sentry from "@sentry/nextjs";

const rawDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const dsn = typeof rawDsn === "string" ? rawDsn.trim() : "";
const tracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1);

/**
 * Robust check to avoid Sentry project ID errors when DSN is malformed on the client.
 */
function isValidSentryDsn(dsn: string): boolean {
    if (!dsn || dsn.toLowerCase() === "undefined" || dsn.toLowerCase() === "null") return false;
    try {
        const url = new URL(dsn);
        const projectId = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean).pop();
        return !!projectId && /^\d+$/.test(projectId) && !!url.username;
    } catch {
        return false;
    }
}

const shouldInitSentry = isValidSentryDsn(dsn);

if (shouldInitSentry) {
    try {
        Sentry.init({
            dsn,
            enabled: true,
            tunnel: "/monitoring",
            sendDefaultPii: false,
            tracesSampleRate: 0.05,
            ignoreErrors: [
                "ResizeObserver loop limit exceeded",
                "Non-Error promise rejection",
                "NetworkError",
                "Load failed",
                "Failed to fetch",
            ],
            beforeSend(event) {
                if (event.request?.headers?.["User-Agent"]?.includes("bot")) return null;
                return event;
            }
        });
    } catch (error) {
        console.warn("[Sentry] Client init failed:", error);
    }
}
