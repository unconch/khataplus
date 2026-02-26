# KhataPlus

Business billing and khata management for Indian businesses. Built with Next.js 14.

## Features

- **Analytics Dashboard** - Revenue, profit, expense tracking with charts
- **Role-Based Access** - Admin, Owner, Staff roles with permissions
- **Mobile-First PWA** - Installable on Android/iOS
- **Sales & Inventory** - POS, stock tracking, GST handling

## Tech Stack

- Next.js 14 (App Router)
- Neon Postgres
- Tailwind CSS + Shadcn UI
- Recharts
- Auth0

## Getting Started

```bash
npm install
```

Create `.env.local`:
```env
DATABASE_URL=your_neon_db_url
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=your_long_random_secret
APP_BASE_URL=http://localhost:3000
```

Run dev server:
```bash
npm run dev
```

## License

MIT
