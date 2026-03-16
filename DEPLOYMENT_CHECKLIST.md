# HillSignal Deployment Checklist

**Created:** March 16, 2026  
**Status:** Pre-deployment investigation complete

---

## 1. Project Structure Overview

The project has **two codebases** in a single repo:

| Directory | Description | Framework | Status |
|-----------|-------------|-----------|--------|
| `/home/ubuntu/hillsignal/src/` | **Original codebase** — basic landing, auth, checkout, dashboard with mock signals | Next.js 16 + React 19 + Tailwind 4 | Connected to GitHub/Vercel |
| `/home/ubuntu/hillsignal/nextjs_space/` | **New codebase** — adds real Congress API integration, Gemini analysis, signals API, settings page, cron job | Next.js 14 + React 18 + Tailwind 3 | Built locally, NOT deployed |

### New files in `nextjs_space/` (not in `src/`):
- `app/api/cron/poll-congress/route.ts` — Cron job to poll Congress API
- `app/api/signals/route.ts` — Signals list API
- `app/api/signals/[id]/route.ts` — Individual signal API
- `app/api/settings/route.ts` — User settings API
- `app/settings/SettingsClient.tsx` + `page.tsx` — Settings UI
- `app/signals/[id]/SignalDetailClient.tsx` + `page.tsx` — Signal detail UI
- `lib/congress-api.ts` — Congress API client
- `lib/gemini-analysis.ts` — Gemini AI analysis integration

### Key Differences:
- `nextjs_space/` uses **Next.js 14** (React 18), root uses **Next.js 16** (React 19)
- `nextjs_space/` has a massive `package.json` with ~100+ dependencies (Radix UI, Prisma, charting libs, etc.) — many are likely unused boilerplate
- `nextjs_space/` uses Tailwind 3 with explicit config; root uses Tailwind 4 (CSS-first)
- `nextjs_space/` has its own `.env` with `CONGRESS_API_KEY` and `ABACUSAI_API_KEY`
- `nextjs_space/` has a working `.build` directory (was built successfully)

---

## 2. ⚠️ CRITICAL DECISION: File Migration Strategy

The `nextjs_space/` code **cannot be deployed as-is** to Vercel via the existing git repo because:
1. Vercel is configured to build from the repo root (`/`), which uses `src/` and the root `package.json`
2. The `nextjs_space/` directory is a separate Next.js project with its own `package.json`, `tsconfig.json`, etc.

### Option A: Merge new features INTO root project (Recommended)
Copy the **new files only** from `nextjs_space/` into the existing `src/` structure:
- [ ] Copy `nextjs_space/lib/congress-api.ts` → `src/lib/congress-api.ts`
- [ ] Copy `nextjs_space/lib/gemini-analysis.ts` → `src/lib/gemini-analysis.ts`
- [ ] Copy `nextjs_space/app/api/cron/poll-congress/route.ts` → `src/app/api/cron/poll-congress/route.ts`
- [ ] Copy `nextjs_space/app/api/signals/route.ts` → `src/app/api/signals/route.ts`
- [ ] Copy `nextjs_space/app/api/signals/[id]/route.ts` → `src/app/api/signals/[id]/route.ts`
- [ ] Copy `nextjs_space/app/api/settings/route.ts` → `src/app/api/settings/route.ts`
- [ ] Copy `nextjs_space/app/settings/` → `src/app/settings/`
- [ ] Copy `nextjs_space/app/signals/[id]/` → `src/app/signals/[id]/`
- [ ] Update root `package.json` to add any truly needed new dependencies (e.g., `lucide-react`)
- [ ] Reconcile any updated files (dashboard, middleware, layout, etc.)
- [ ] Test build with `npm run build`

**Pros:** Keeps existing Vercel/GitHub setup, cleaner deployment  
**Cons:** Manual merge effort, need to resolve React 18 vs 19 differences

### Option B: Replace root with nextjs_space content
- [ ] Back up `src/` directory
- [ ] Move `nextjs_space/` contents to root (replace `src/` with `app/`, etc.)
- [ ] Update root `package.json` with `nextjs_space/package.json` deps
- [ ] Reconfigure Vercel build settings if needed

**Pros:** Uses the latest code as-is  
**Cons:** Downgrades to Next.js 14/React 18, brings in ~100 unnecessary dependencies, may break Vercel config

### Option C: Configure Vercel to build from `nextjs_space/` subdirectory
- [ ] In Vercel project settings, set Root Directory to `nextjs_space`
- [ ] Ensure all env vars are set in Vercel

**Pros:** Quickest path to deploy  
**Cons:** Leaves dead code in root, confusing project structure

---

## 3. Environment Variables

### Currently Set (in `.env.local` / `.env`):
| Variable | Status | Location |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | Both |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | Both |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Placeholder | Root only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ Placeholder | Root only |
| `STRIPE_SECRET_KEY` | ❌ Placeholder | Root only |
| `STRIPE_WEBHOOK_SECRET` | ❌ Placeholder | Root only |
| `NEXT_PUBLIC_APP_URL` | ⚠️ localhost | Root only |
| `CONGRESS_API_KEY` | ✅ Set | nextjs_space only |
| `ABACUSAI_API_KEY` | ✅ Set | nextjs_space only |

### Required for Production (Vercel Env Vars):
| Variable | Source | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Already known |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Already known |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | **MUST GET from Supabase** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys | **MUST GET from Stripe** |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | **MUST GET from Stripe** |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Signing secret | **Created after webhook setup** |
| `NEXT_PUBLIC_APP_URL` | `https://hillsignal.com` | Set to production domain |
| `CONGRESS_API_KEY` | Already have: `CCGgmJEjK8FkYeoNM0BWkrTEp7aSLLjLYcDffGgJ` | For Congress API polling |
| `CRON_SECRET` | Generate a random string | Secures the cron endpoint |
| `GOOGLE_AI_API_KEY` | Google AI Studio | For Gemini analysis (if used) |

---

## 4. Database Migrations

### SQL File: `supabase/SUPABASE_SETUP.sql`
This creates:
1. **`users`** table (extends `auth.users`)
2. **`user_preferences`** table (sectors, email frequency)
3. **`purchases`** table (Stripe payment records)
4. **`signals`** table (Congressional signals data)
5. **Functions:** `handle_new_user()`, `update_updated_at()`, `get_purchase_count()`
6. **RLS policies** for all tables
7. **Indexes** for performance

### Steps to Run:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Select project
2. Navigate to **SQL Editor**
3. Paste the entire contents of `supabase/SUPABASE_SETUP.sql`
4. Click **Run**
5. Verify tables exist in **Table Editor**
6. Verify RLS is enabled on all tables
7. Check **Authentication → URL Configuration** — set redirect URL to `https://hillsignal.com/auth/callback`

### ⚠️ Additional Migration Needed for `nextjs_space/`:
The `signals` table may need additional columns that `nextjs_space` code expects (e.g., `full_analysis`, `key_takeaways`, `market_implications`, `legislators`, `bill_number`, `source_url`). Check the `lib/types.ts` in `nextjs_space/` for the full Signal interface and compare with the SQL schema.

---

## 5. Stripe Setup Steps

1. **Get API Keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
   - Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy Secret key → `STRIPE_SECRET_KEY`

2. **Create Webhook Endpoint:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://hillsignal.com/api/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`

3. **Detailed guide:** See `/home/ubuntu/hillsignal-stripe-webhook-setup.md`

---

## 6. Deployment Steps (Vercel)

### Pre-deployment:
- [ ] Decide on migration strategy (Option A, B, or C above)
- [ ] Run database migration in Supabase
- [ ] Get all Stripe API keys
- [ ] Get Supabase service role key

### Deploy:
- [ ] Set all environment variables in Vercel Dashboard
- [ ] Push code to GitHub (`git push origin main`)
- [ ] Vercel auto-deploys from GitHub
- [ ] Verify build succeeds in Vercel Dashboard

### Post-deployment:
- [ ] Test health endpoint: `https://hillsignal.com/api/health`
- [ ] Test landing page loads with dynamic pricing
- [ ] Test signup → email verification → checkout flow
- [ ] Test Stripe webhook by making a test payment
- [ ] Verify purchase records appear in Supabase
- [ ] Test dashboard access after payment
- [ ] Configure cron job (Vercel Cron or external service like cron-job.org)

---

## 7. Cron Job Setup

The `nextjs_space/app/api/cron/poll-congress/route.ts` endpoint polls the Congress API for new data.

### Option 1: Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/poll-congress",
      "schedule": "0 */6 * * *"
    }
  ]
}
```
Protect with `CRON_SECRET` env var.

### Option 2: External Cron Service
Use [cron-job.org](https://cron-job.org) or similar to hit the endpoint periodically.

---

## 8. DNS / Domain Setup

If using Namecheap:
1. In Vercel: Add custom domain `hillsignal.com`
2. In Namecheap: Set DNS records as Vercel instructs (typically CNAME or A records)
3. Wait for SSL certificate provisioning (automatic via Vercel)

---

## 9. Summary of Immediate Action Items

| # | Action | Priority | Owner |
|---|--------|----------|-------|
| 1 | Decide migration strategy (A/B/C) | 🔴 High | User |
| 2 | Get Supabase service role key | 🔴 High | User |
| 3 | Get Stripe API keys (live or test) | 🔴 High | User |
| 4 | Run `SUPABASE_SETUP.sql` in Supabase SQL Editor | 🔴 High | User |
| 5 | Set env vars in Vercel | 🔴 High | User |
| 6 | Execute migration strategy | 🔴 High | Dev |
| 7 | Create Stripe webhook endpoint | 🟡 Medium | User |
| 8 | Configure cron job | 🟡 Medium | Dev |
| 9 | Set up custom domain DNS | 🟢 Low | User |
| 10 | Test end-to-end flow | 🔴 High | Both |
