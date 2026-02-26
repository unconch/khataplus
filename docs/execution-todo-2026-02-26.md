# Execution Todo (2026-02-26)

## Goal
Improve settings UX consistency, activate Merchant Academy, add real AI-powered UX (outside migration), and stabilize PWA behavior.

## Research Summary

### 1) Vault & Governance UX
- Current implementation in `components/security-settings.tsx` was visually heavy and inconsistent with other settings tabs.
- Other settings tabs use clean cards and compact controls in `app/(app)/dashboard/settings/page.tsx`.
- Core required capabilities:
  - Biometric lock toggle
  - Passkey enrollment modal
  - Governance toggles (staff permissions)
  - Session review/revoke

### 2) Merchant Academy
- Academy exists in `app/docs/academy-client.tsx` but was mostly static showcase content.
- It lacked workflow linkage and progress persistence.
- Best utility improvements:
  - Direct jump-to-app actions
  - Learning-level filters
  - Search over lessons
  - Persistent progress

### 3) AI-powered UX (non-migration)
- Existing Groq usage is mostly in import/migration and CSV analysis endpoints.
- No daily in-product assistant in dashboard flow.
- Best low-risk insertion point:
  - Dashboard summary card with one concise recommendation
  - API endpoint with Groq + deterministic fallback

### 4) PWA stability
- PWA runtime present via `@ducanh2912/next-pwa` in `next.config.mjs`.
- Sync and realtime hooks existed but had noisy/fragile behavior:
  - repeated online/offline toasts
  - sync fetches without explicit credentials
  - SSE/polling transitions not guarded for online/offline state

## Execution Order

1. Simplify Vault & Governance tab UX and preserve all functionality.
2. Upgrade Merchant Academy into an action-first learning hub.
3. Add AI Business Coach on dashboard with Groq and fallback logic.
4. Harden PWA/sync behavior for smoother offline/online transitions.

## Status

- [x] Task 1 completed
- [x] Task 2 completed
- [x] Task 3 completed (v1)
- [x] Task 4 completed (stability pass v1)

## Post-change diagnostics
- Run `npx tsc --noEmit`
- Run runtime validation:
  - settings/security toggles
  - passkey modal fallback path
  - docs academy interaction
  - dashboard AI card loads
  - offline/online transition and sync

