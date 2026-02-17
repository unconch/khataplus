# KhataPlus — Development Notes

> **Last Updated:** 2026-02-16
> **Purpose:** This document is the single source of truth for any AI model or developer working on KhataPlus. Read this FIRST before making any changes.

---

## 1. What Is KhataPlus?

KhataPlus is a **multi-tenant SaaS business management platform** for Indian SMBs (small and medium businesses). It handles:

- **Inventory management** (stock tracking, SKU management, HSN codes)
- **Sales recording** (Cash, UPI, Credit payment methods)
- **Khata (credit ledger)** — Indian-style customer credit/debit tracking
- **Supplier management** — purchase tracking, payment ledger
- **Expense tracking** — categorized business expenses
- **Daily reports** — automated P&L summaries
- **GST compliance** — GSTIN, CGST/SGST/IGST, GSTR-1 JSON generation
- **Professional invoicing** — GST-compliant invoice generation
- **Analytics** — revenue charts, inventory health, top items
- **Team management** — multi-user with role-based access (Owner, Manager, Staff)
- **Data migration** — CSV import wizard for onboarding from other tools

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Neon PostgreSQL (serverless) |
| **Auth** | Supabase Auth (Google OAuth, Email/Password) |
| **ORM/Query** | Raw SQL via `@neondatabase/serverless` (neon tagged templates) |
| **Styling** | Tailwind CSS + custom CSS (`globals.css`) |
| **UI Components** | shadcn/ui (Radix primitives) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Email** | Resend |
| **Rate Limiting** | Upstash Redis |
| **Error Monitoring** | Sentry |
| **Deployment** | Vercel |
| **PWA** | Service Worker + Web App Manifest |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│  React Components → Server Actions → API Routes          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  MIDDLEWARE (middleware.ts)                │
│  • Supabase Auth session validation                      │
│  • Org slug routing (/{slug}/dashboard → /dashboard)     │
│  • Guest/Demo mode detection                             │
│  • Session governance (revocation checks via Redis)      │
│  • Security headers (CSP, HSTS, X-Frame-Options)         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  DATA LAYER (lib/data/*.ts)               │
│  • Server-only functions ("use server")                  │
│  • Raw SQL queries via lib/db.ts                         │
│  • Authorization via lib/security.ts                     │
│  • Encrypted audit logs via lib/crypto.ts                │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  PRODUCTION DB   │         │   SANDBOX DB     │
│  (Neon - AP SE)  │         │  (Neon - EU West)│
│  DATABASE_URL    │         │ DEMO_DATABASE_URL │
└─────────────────┘         └─────────────────┘
```

---

## 4. Multi-Tenancy & Routing

### Organization Slug Routing

KhataPlus uses **URL-based multi-tenancy**. Each organization gets a unique slug.

**URL pattern:** `/{org-slug}/dashboard/...`

The middleware (`middleware.ts`) handles this:

1. Extracts the first URL segment
2. Checks against `SYSTEM_PREFIXES` (auth, api, setup-organization, etc.)
3. If NOT a system route → treats it as an org slug
4. Rewrites the URL: `/{slug}/dashboard/sales` → `/dashboard/sales`
5. Sets headers: `x-tenant-slug`, `x-path-prefix`

**⚠️ CRITICAL: The `org` object can be null**
The dashboard component receives `org` as a prop. It CAN be null if the user hasn't set up an organization yet. **Always use optional chaining** (`org?.slug`) or a fallback constant:

```typescript
// ✅ CORRECT — Robust pattern used in home-dashboard.tsx
const slug = org?.slug || 'dashboard'
const orgName = org?.name || 'My Business'

// ❌ WRONG — Will crash if org is null
<Link href={`/${org.slug}/dashboard/settings`}>
```

### Demo/Guest Mode

- URL prefix `/demo/...` activates guest mode
- Sets `guest_mode` cookie
- Routes all SQL queries to `DEMO_DATABASE_URL` (separate sandbox DB)
- Guest users get a synthetic profile with owner privileges

---

## 5. Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User accounts | `id`, `email`, `name`, `phone`, `role`, `status`, `biometric_required`, `referral_code`, `referred_by`, `organization_id` |
| `organizations` | Business entities | `id`, `name`, `slug`, `gstin`, `address`, `phone`, `upi_id`, `plan_type`, `subscription_status`, `trial_ends_at`, `created_by` |
| `organization_members` | User ↔ Org mapping | `id`, `org_id`, `user_id`, `role` (owner/manager/staff) |
| `organization_invites` | Team invitations | `id`, `org_id`, `email`, `role`, `token`, `expires_at` |
| `inventory` | Products/Stock | `id`, `sku`, `name`, `buy_price`, `gst_percentage`, `stock`, `hsn_code`, `min_stock`, `org_id` |
| `sales` | Sale transactions | `id`, `inventory_id`, `user_id`, `quantity`, `sale_price`, `total_amount`, `gst_amount`, `profit`, `payment_method`, `payment_status`, `org_id` |
| `reports` | Daily P&L summaries | `id`, `report_date`, `total_sale_gross`, `total_cost`, `expenses`, `cash_sale`, `online_sale`, `org_id` |
| `expenses` | Business expenses | `id`, `category`, `amount`, `description`, `expense_date`, `org_id` |
| `customers` | Customer directory | `id`, `name`, `phone`, `address`, `balance`, `org_id` |
| `khata_transactions` | Credit ledger | `id`, `customer_id`, `type` (credit/payment), `amount`, `sale_id`, `note` |
| `suppliers` | Supplier directory | `id`, `name`, `phone`, `address`, `gstin`, `org_id` |
| `supplier_transactions` | Supplier ledger | `id`, `supplier_id`, `type` (purchase/payment), `amount`, `invoice_no`, `org_id` |
| `audit_logs` | Encrypted audit trail | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details` (encrypted), `org_id` |
| `referrals` | Referral tracking | `referrer_id`, `referred_id`, `status` |
| `referral_rules` | Referral reward config | `reward_type`, `plan_type`, `reward_days`, `is_active` |

### ⚠️ Schema Change Rules

> **ANY model adding new columns MUST:**
> 1. Add the column to the database via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
> 2. Add the field to the TypeScript interface in `lib/types.ts`
> 3. Update all SQL queries that INSERT into or UPDATE that table
> 4. Test by refreshing the dashboard

**Common gotcha:** Adding a field to the code but NOT running the migration breaks the entire app with `column "X" of relation "Y" does not exist`.

### ⚠️ CHECK Constraints

Several tables have CHECK constraints on role/type columns:

| Table | Column | Allowed Values |
|-------|--------|----------------|
| `profiles` | `role` | `'owner'`, `'staff'` |
| `organization_members` | `role` | `'owner'`, `'admin'`, `'manager'`, `'staff'` |
| `khata_transactions` | `type` | `'credit'`, `'payment'` |

**CRITICAL:** If you rename a role value in code, you MUST also update the database CHECK constraint. Otherwise INSERTs will fail with `violates check constraint`.

### Database Triggers

- **`sync_profile_to_auth_metadata`** — This trigger was DROPPED because it referenced `auth.users` which is only available via Supabase's internal connection, not via the direct Neon connection. Auth sync is now handled exclusively at the **application layer** via `syncToAuth()` in `lib/data/profiles.ts`.

---

## 6. Database Layer (lib/db.ts)

The database layer is a **smart SQL wrapper** that:

1. **Auto-detects context** — checks cookies/headers to determine prod vs demo
2. **Dual-database routing** — production data vs sandbox (guest) data
3. **Connection caching** — reuses Neon serverless connections
4. **Graceful fallback** — if request context is unavailable (e.g., inside `unstable_cache`), falls back to production DB

### Usage

```typescript
import { sql } from "@/lib/db"

// Tagged template (standard usage)
const result = await sql`SELECT * FROM profiles WHERE id = ${userId}`

// The wrapper handles:
// - Which database to connect to (prod vs demo)
// - Connection pooling
// - Error propagation
```

### Direct Access (for scripts/migrations)

```typescript
import { getProductionSql, getDemoSql } from "@/lib/db"
const db = getProductionSql()
await db`ALTER TABLE profiles ADD COLUMN phone TEXT`
```

---

## 7. Authentication Flow

### Providers
- **Google OAuth** (primary)
- **Email/Password** with email verification

### Flow
1. User signs in via Supabase Auth → `/auth/login`
2. Supabase session cookie is set
3. Middleware validates session on every request
4. `ensureProfile()` creates/migrates profile record in `profiles` table
5. Profile data is synced to Supabase Auth metadata via `syncToAuth()`
6. User is redirected to `/{org-slug}/dashboard`

### Profile Lifecycle (`lib/data/profiles.ts`)

The `ensureProfile()` function handles complex scenarios:

1. **Existing profile** → Updates name/phone if changed
2. **Email exists but different ID** → Full data migration (profile + all foreign keys)
3. **Brand new user** → Creates profile, assigns referral code, syncs to auth

### Session Governance

- Redis-backed session validation (`lib/session-governance.ts`)
- Session revocation support
- Checked in middleware on every request

---

## 8. Security Architecture

### Authorization (`lib/security.ts`)

- `authorize(action, requiredRole?, orgId?)` — validates session, checks role
- Organization-level role checking via `organization_members` table
- Roles: `owner` > `manager` > `staff`
- Guest users bypass auth with synthetic owner profile

### Audit Logging

- Every mutation is logged to `audit_logs`
- Details are **AES-256-GCM encrypted** using tenant-specific DEKs
- Key management via `lib/key-management.ts`
- Constant-time comparison for secrets (`secureCompare`)

### Security Headers (Middleware)

- Content Security Policy (CSP)
- HSTS with preload
- X-Frame-Options: DENY
- Strict Referrer Policy

---

## 9. Data Access Modules (lib/data/)

Each module handles CRUD for its entity:

| Module | Entities | Key Functions |
|--------|----------|--------------|
| `profiles.ts` | Users | `ensureProfile`, `upsertProfile`, `getProfile`, `updateUserRole` |
| `organizations.ts` | Orgs | `createOrganization`, `getOrganization`, `updateOrganization`, `inviteUser` |
| `inventory.ts` | Products | `getInventory`, `addInventoryItem`, `updateStock` |
| `sales.ts` | Transactions | `createSale`, `getSales`, `getSalesByDateRange` |
| `customers.ts` | Customers | `getCustomers`, `createCustomer`, `updateCustomerBalance` |
| `suppliers.ts` | Suppliers | `getSuppliers`, `createSupplier` |
| `expenses.ts` | Expenses | `getExpenses`, `createExpense` |
| `reports.ts` | Daily reports | `getReports`, `generateDailyReport` |
| `analytics.ts` | Insights | Revenue trends, top items, customer analytics |
| `audit.ts` | Audit logs | `createAuditLog` |
| `migration.ts` | Data import | Migration status and tracking |
| `gst-automation.ts` | GST | Auto-fill GST fields, HSN lookup |

### Pattern

All data modules follow this pattern:
```typescript
"use server"
import { sql } from "../db"
import { authorize, audit } from "../security"

export async function doSomething(orgId: string, data: any) {
    await authorize("Do Something", "staff", orgId)  // Check permissions
    const result = await sql`INSERT INTO ...`          // Execute query
    await audit("Did Something", "entity", id, data, orgId)  // Log it
    return result
}
```

---

## 10. Key Components

### Dashboard (`components/home-dashboard.tsx`)
- Time-aware greeting
- Metric cards (sales, dues, inventory health)
- Revenue/profit area chart (Recharts)
- Quick action buttons (New Sale, Invoice, Stock, Customer)
- Recent transactions feed
- Low stock alerts
- Cash vs Online payment split (pie chart)
- Trial banner + profile completion nudge

### Migration Wizard (`components/migration-view.tsx`)
- 4-step wizard: Source → Upload → Preview → Import
- CSV parsing with auto-detection of data type
- Template downloads for each entity type
- Confetti animation on success

### Sales Form (`components/sales-form.tsx`)
- Product selection with search
- Auto GST calculation (CGST/SGST/IGST)
- Payment method selection (Cash, UPI, Credit)
- Credit sales auto-create Khata transactions

### Khata Ledger (`components/khata-ledger.tsx`)
- Customer-wise credit/debit history
- Payment recording
- Balance tracking

---

## 11. API Routes (app/api/)

| Route | Purpose |
|-------|---------|
| `/api/auth/...` | WebAuthn registration/authentication |
| `/api/sales` | Sales CRUD |
| `/api/customers` | Customer management |
| `/api/suppliers` | Supplier management |
| `/api/supplier-transactions` | Supplier ledger |
| `/api/khata` | Customer credit transactions |
| `/api/organizations/...` | Org management, settings |
| `/api/invite` | Team invitations |
| `/api/migration` | Data import endpoints |
| `/api/gstr1` | GSTR-1 JSON generation |
| `/api/search` | Global search |
| `/api/sync` | Data synchronization |
| `/api/webhooks` | External webhooks |
| `/api/seed` | Demo data seeding |
| `/api/track` | Analytics tracking |

---

## 12. Monetization

### Plan Types
- `free` — Basic features
- `starter` — Core business tools
- `pro` — Full suite with add-ons
- `legacy` — Pioneer/founding member pricing

### Add-ons (per-org flags)
- `whatsapp_addon_active` — WhatsApp notifications
- `gst_addon_active` — GST compliance tools
- `inventory_pro_active` — Advanced inventory
- `vernacular_pack_active` — Regional language support
- `ai_forecast_active` — AI demand forecasting

### Trial System
- Organizations start with a trial period
- `trial_ends_at` tracks expiry
- Dashboard shows trial countdown banner
- Read-only mode after trial expires

---

## 13. Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Production Neon PostgreSQL connection |
| `DEMO_DATABASE_URL` | Sandbox/demo database connection |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `ENCRYPTION_KEY` | AES-256-GCM key for `lib/crypto.ts` |
| `UPSTASH_REDIS_REST_URL` | Redis for rate limiting & sessions |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token |
| `RESEND_API_KEY` | Email sending via Resend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client |

---

## 14. Common Pitfalls & Rules

### ⛔ DO NOT:

1. **Remove columns from SQL queries without checking the DB first.** If a query references a column and it doesn't exist, add the column — don't remove the reference.
2. **Access `org.slug` or `org.name` without null checks.** The org prop can be null. Always use: `const slug = org?.slug || 'dashboard'`
3. **Forget to import `"use server"` in data modules.** Server actions won't work without it.
4. **Use `sql()` with a string call.** Neon requires tagged templates: `` sql`SELECT ...` `` not `sql("SELECT ...")`.
5. **Skip audit logging on mutations.** Every write operation must be audited.
6. **Modify roles without checking `organization_members`.** The `role` field on `profiles` is the global role; org-specific roles are in `organization_members`.

### ✅ DO:

1. **Always check the DB schema** before assuming a column exists/doesn't exist.
2. **Use the centralized `slug` constant** for all org-based URLs in components.
3. **Test with guest/demo mode** to ensure sandbox isolation works.
4. **Keep TypeScript types in sync** with actual database columns (`lib/types.ts`).
5. **Use `unstable_cache`** with `getProductionSql()` for cached queries (the auto-detect won't work inside cache scope).

---

## 15. File Structure Quick Reference

```
KhataPlus/
├── app/
│   ├── (app)/dashboard/      # Main dashboard routes
│   │   ├── page.tsx           # Home dashboard (server component)
│   │   ├── sales/             # Sales module
│   │   ├── inventory/         # Inventory module
│   │   ├── customers/         # Customer management
│   │   ├── suppliers/         # Supplier management
│   │   ├── khata/             # Credit ledger
│   │   ├── reports/           # Daily reports
│   │   ├── analytics/         # Business analytics
│   │   ├── settings/          # Organization settings
│   │   ├── migration/         # Data import wizard
│   │   ├── admin/             # Admin panel
│   │   └── executive/         # Executive dashboard
│   ├── api/                   # API routes
│   ├── auth/                  # Auth pages (login, register)
│   └── setup-organization/    # Org onboarding
├── components/                # React components (128 files)
│   ├── home-dashboard.tsx     # Main dashboard view
│   ├── migration-view.tsx     # Data import wizard
│   ├── sales-form.tsx         # Sale creation form
│   ├── khata-ledger.tsx       # Credit ledger
│   ├── settings-form.tsx      # Settings management
│   └── ui/                    # shadcn/ui primitives
├── lib/
│   ├── db.ts                  # Database wrapper (dual-DB routing)
│   ├── types.ts               # TypeScript interfaces (KEEP IN SYNC)
│   ├── security.ts            # Authorization & audit engine
│   ├── crypto.ts              # AES-256-GCM encryption
│   ├── session.ts             # Session management
│   ├── import.ts              # CSV import logic
│   ├── invoice-utils.ts       # Invoice generation
│   ├── data/                  # Server-side data access (15 modules)
│   └── supabase/              # Supabase client configs
├── middleware.ts               # Auth, routing, security headers
├── hooks/                     # React hooks
└── styles/                    # Global CSS
```

---

## 16. Running the App

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# The app runs at http://localhost:3000
# Demo mode: http://localhost:3000/demo
# Org-specific: http://localhost:3000/{org-slug}/dashboard
```

---

*This document should be read by any AI model or developer before making changes to the codebase. When in doubt, check the database schema first, check `lib/types.ts` second, and check this document third.*
