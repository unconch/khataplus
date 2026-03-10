# Supabase Proxy Worker (Cloudflare)

This Worker proxies Supabase endpoints through your own Cloudflare domain.

## 1) Install

```bash
cd cloudflare/supabase-proxy-worker
npm install
```

## 2) Configure

Update `wrangler.toml`:

- `SUPABASE_ORIGIN`: your Supabase origin (example: `https://your-ref.supabase.co`)
- `ALLOWED_ORIGINS`: comma-separated frontend origins

Example:

```toml
[vars]
SUPABASE_ORIGIN = "https://your-ref.supabase.co"
ALLOWED_ORIGINS = "https://app.khataplus.online,https://khataplus.online,http://localhost:3000"
```

## 3) Deploy

```bash
npx wrangler login
npm run deploy
```

After deploy, you get a Worker URL like:

`https://supabase-proxy-worker.<account>.workers.dev`

## 4) Point app to proxy

In `KhataPlus/.env.local` set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase-proxy-worker.<account>.workers.dev
```

Keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` unchanged.

## 5) Verify

Test endpoints:

- `GET /healthz` -> `200 ok`
- `GET /auth/v1/health` -> `200`
- `GET /storage/v1/bucket` with auth headers -> `200`

## Notes

- Allowed prefixes: `/auth/v1`, `/rest/v1`, `/storage/v1`, `/realtime/v1`, `/functions/v1`, `/graphql/v1`
- CORS is controlled by `ALLOWED_ORIGINS`
- This is a proxy. Supabase Auth provider settings still apply in your Supabase project.
