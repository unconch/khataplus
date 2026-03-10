# Build/Runtime Error TODOs

1. [x] Fix `next build` failure: avoid spawn-dependent steps locally (Sentry build gated, typecheck opt-in via `NEXT_ENABLE_TYPECHECK`).
1. [x] Remove Sentry build warning about missing `onRouterTransitionStart` export in `instrumentation-client.ts`.
1. [x] Resolve Next.js warning: migrated `middleware.ts` to `proxy.ts`.
1. [x] Default local builds to skip typecheck unless `NEXT_ENABLE_TYPECHECK=true` (CI keeps typecheck on).
