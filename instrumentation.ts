import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Suppress url.parse deprecation warning (Node 24/Next.js 16 compatibility)
  // This warning often originates from external libraries and can clutter the console/dev overlay.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const originalEmit = process.emit;
    // @ts-ignore
    process.emit = function (name: string | symbol, ...args: any[]) {
      const data = args[0];
      if (
        name === 'warning' &&
        typeof data === 'object' &&
        data !== null &&
        (data as any).name === 'DeprecationWarning' &&
        (data as any).message?.includes('url.parse')
      ) {
        return false;
      }
      return originalEmit.apply(process, args as any);
    };
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
