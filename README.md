# HillSignal

> Real-time Congressional activity intelligence for informed investors.

![HillSignal](https://img.shields.io/badge/version-1.0.0-orange)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## Overview

HillSignal tracks Congressional activity and translates it into actionable market intelligence. Get real-time signals from committee hearings, floor votes, and legislative actions — with affected tickers, sentiment analysis, and impact scores.

### Features

- 📡 **Real-Time Signals** - Congressional activity delivered within minutes
- 📊 **Market Impact Analysis** - Affected tickers, sectors, and impact scores
- 🎯 **Personalized Alerts** - Filter by sector, committee, or ticker
- 📱 **Mobile-First Design** - Bloomberg-lite dark aesthetic
- 🔐 **Secure Authentication** - Email/password via Supabase
- 💳 **Tiered Pricing** - Early adopters pay less, forever

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Checkout
- **Deployment**: Railway

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hillsignal.git
cd hillsignal

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your keys
# See DEPLOYMENT.md for detailed instructions
```

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Go to Supabase SQL Editor
2. Run the migration in `supabase/migrations/001_initial_schema.sql`

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Project Structure

```
hillsignal/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── api/                # API routes
│   │   │   ├── checkout/       # Stripe checkout session
│   │   │   ├── webhook/        # Stripe webhooks
│   │   │   ├── pricing/        # Current pricing API
│   │   │   └── health/         # Health check endpoint
│   │   ├── checkout/           # Checkout page
│   │   ├── dashboard/          # Protected dashboard
│   │   ├── success/            # Post-payment success
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   └── landing/            # Landing page sections
│   └── lib/                    # Utilities & configurations
│       ├── supabase/           # Supabase client setup
│       ├── stripe.ts           # Stripe configuration
│       └── types.ts            # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
├── .env.example                # Environment template
├── DEPLOYMENT.md               # Deployment guide
├── railway.json                # Railway configuration
└── README.md                   # This file
```

## Pricing Tiers

| Tier | Users | Price | Type |
|------|-------|-------|------|
| Founding Member | 0 - 1,000 | $5 | Lifetime |
| Early Adopter | 1,001 - 3,000 | $9 | Lifetime |
| Growth | 3,001 - 5,000 | $15 | Lifetime |
| Standard | 5,001+ | $19/mo | Subscription |

Pricing is calculated dynamically based on total completed purchases.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/pricing` - Current pricing tier
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhook` - Stripe webhook handler

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

- Supabase setup and service role key location
- Stripe configuration and webhooks
- Railway deployment
- Namecheap DNS configuration
- SSL certificate setup

## Security

- All sensitive keys stored in environment variables
- Service role key never exposed to client
- Row Level Security (RLS) enabled on all tables
- CORS and security headers configured
- Stripe webhook signature verification

## License

Proprietary. All rights reserved.

## Support

Email: support@hillsignal.com
