import * as Sentry from "@sentry/nextjs";

const rawDsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const dsn = typeof rawDsn === "string" ? rawDsn.trim() : "";
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1);

/**
 * Robust check to avoid Sentry project ID errors when DSN is malformed.
 * Valid Sentry DSN should look like: https://publicKey@host/projectId
 */
function isValidSentryDsn(dsn: string): boolean {
  if (!dsn || dsn.toLowerCase() === "undefined" || dsn.toLowerCase() === "null") return false;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean).pop();
    // projectId must be present and purely numeric for Sentry SaaS.
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
      sendDefaultPii: true,
      tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    });
  } catch (error) {
    console.warn("[Sentry] Edge init failed:", error);
  }
}
