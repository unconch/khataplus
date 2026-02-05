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
- Descope Auth

## Getting Started

```bash
npm install
```

Create `.env.local`:
```env
DATABASE_URL=your_neon_db_url
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_id
```

Run dev server:
```bash
npm run dev
```

## License

MIT