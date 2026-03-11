import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Suppress url.parse deprecation warning (Node 24/Next.js 16 compatibility)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const originalEmit = process.emit;
    // @ts-ignore
    process.emit = function (name: string | symbol, ...args: any[]) {
      const data = args[0];

      // Suppress url.parse deprecation warning
      if (
        name === 'warning' &&
        typeof data === 'object' &&
        data !== null &&
        (data as any).name === 'DeprecationWarning' &&
        (data as any).message?.includes('url.parse')
      ) {
        return false;
      }

      // Prevent hard crash from Supabase background auth errors in Next.js 16
      if (name === 'uncaughtException') {
        const err = args[0] as Error;
        const msg = err?.message || '';
        const stack = err?.stack || '';

        const isSupabaseError =
          stack.includes('@supabase/auth-js') ||
          msg.includes('logError') ||
          msg.includes('bound logError') ||
          stack.includes('_emitInitialSession') ||
          stack.includes('_notifyAllSubscribers');

        if (isSupabaseError) {
          console.warn("[Instrumentation] SILENCED CRASH (Supabase Auth Leak):", msg || "Empty error message");
          // If you want to see the stack trace for debugging one time:
          // console.warn(stack);
          return false;
        }

        console.error("--- REAL UNCAUGHT EXCEPTION ---");
        console.error(err);
        console.error("-------------------------------");
      }

      return originalEmit.apply(process, args as any);
    };

    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
