import * as Sentry from "@sentry/nextjs";

// Hook required by Sentry to instrument router transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
