# HillSignal Deployment Guide

This guide walks you through deploying HillSignal to Vercel with Supabase and Stripe integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Stripe Setup](#stripe-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Domain Configuration](#domain-configuration)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Supabase account](https://supabase.com) (free tier works)
- [Stripe account](https://stripe.com) (free to create)
- [Vercel account](https://vercel.com) (free tier available)
- Domain registered (hillsignal.com)
- Git installed locally

---

## Supabase Setup

### Step 1: Get Your API Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Project Settings** (gear icon in sidebar)
4. Click on **API** in the left menu

You'll see:
- **Project URL**: `https://your-project.supabase.co`
- **anon public key**: Safe to use in client-side code
- **service_role key**: ⚠️ **KEEP SECRET** - Only use server-side

### Step 2: Find the Service Role Key

> ⚠️ **IMPORTANT**: The service_role key bypasses Row Level Security. Never expose it in client-side code.

1. In Supabase Dashboard, go to **Project Settings** > **API**
2. Scroll down to **Project API keys**
3. Find `service_role` (it says "This key has the ability to bypass Row Level Security")
4. Click the eye icon to reveal it, or click "Copy"
5. Save this securely - you'll need it for Vercel

### Step 3: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/SUPABASE_SETUP.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### Step 4: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Ensure **Email** provider is enabled
3. Go to **Authentication** > **URL Configuration**
4. Set **Site URL** to your domain: `https://hillsignal.com`
5. Add **Redirect URLs**:
   - `https://hillsignal.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

---

## Stripe Setup

### Step 1: Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** in the sidebar
3. Click **API keys**

You'll see:
- **Publishable key**: `pk_test_...` (safe for client-side)
- **Secret key**: `sk_test_...` (⚠️ server-side only)

> 💡 **Tip**: Use test keys for development, switch to live keys for production.

### Step 2: Set Up Webhook (After Deployment)

You'll complete this step after deploying to Vercel:

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://hillsignal.com/api/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Click on your new endpoint
7. Under **Signing secret**, click **Reveal** and copy the `whsec_...` value
8. Add this as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 3: Test Mode vs Live Mode

- **Test Mode** (default): Use `pk_test_` and `sk_test_` keys. Payments are simulated.
- **Live Mode**: Use `pk_live_` and `sk_live_` keys. Real payments processed.

To switch, toggle **Test mode** in the Stripe Dashboard header.

---

## Vercel Deployment

### Step 1: Connect Your GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** > **Project**
3. Import your GitHub repository (`jonwickdev/HillSignal`)
4. Vercel will automatically detect it's a Next.js application

### Step 2: Configure Environment Variables

Before deploying, add your environment variables:

1. In the **Configure Project** section, expand **Environment Variables**
2. Add each variable:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (add after webhook setup) |
| `NEXT_PUBLIC_APP_URL` | `https://hillsignal.com` |

3. Click **Deploy**

### Step 3: Verify Deployment

1. Vercel will build and deploy automatically
2. Once deployed, you'll get a URL like `hillsignal.vercel.app`
3. Visit your deployment URL to verify it works
4. Test the health endpoint: `your-url.vercel.app/api/health`

---

## Domain Configuration

### Step 1: Add Custom Domain in Vercel

1. In Vercel Dashboard, select your project
2. Go to **Settings** > **Domains**
3. Enter your domain: `hillsignal.com`
4. Click **Add**
5. Vercel will show you the required DNS records

### Step 2: Configure DNS (Namecheap Example)

1. Log in to your domain registrar (e.g., [Namecheap](https://namecheap.com))
2. Go to **Domain List** > find your domain > **Manage**
3. Click **Advanced DNS** tab
4. Delete any existing A, AAAA, or CNAME records for `@` and `www`
5. Add the records Vercel provides (typically):

**For root domain:**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | Automatic |

**For www subdomain:**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | Automatic |

6. Save your changes

### Step 3: Verify Domain & SSL

1. Return to Vercel **Settings** > **Domains**
2. Wait for domain verification (usually a few minutes)
3. Vercel automatically provisions SSL certificates
4. Your site will be live at `https://hillsignal.com`

---

## Post-Deployment

### Set Up Stripe Webhook

Now that your site is live:

1. Go to Stripe Dashboard > **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://hillsignal.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret (`whsec_...`)
6. Add to Vercel: **Settings** > **Environment Variables**
7. Add `STRIPE_WEBHOOK_SECRET` with the webhook secret value
8. Redeploy (push a commit or click **Redeploy** in Vercel)

### Update Supabase Redirect URLs

1. In Supabase > **Authentication** > **URL Configuration**
2. Update Site URL to `https://hillsignal.com`
3. Add redirect URL: `https://hillsignal.com/auth/callback`

### Test Everything

1. ✅ Landing page loads at `https://hillsignal.com`
2. ✅ Health check: `https://hillsignal.com/api/health`
3. ✅ Sign up flow works
4. ✅ Email confirmation works
5. ✅ Stripe checkout redirects correctly
6. ✅ Payment webhook fires (check Stripe logs)
7. ✅ User can access dashboard after payment

---

## Troubleshooting

### Build Failures

- Check the Vercel deployment logs for specific errors
- Ensure all environment variables are set correctly
- Verify `package.json` has correct build scripts

### "Invalid API Key" Error

- Double-check your Supabase/Stripe keys in Vercel environment variables
- Ensure there are no extra spaces or newlines
- Make sure you're using the correct environment (test vs live)

### Authentication Not Working

- Check Supabase redirect URLs include your domain
- Verify Site URL is set correctly in Supabase
- Check browser console for CORS errors

### Stripe Checkout Fails

- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe Dashboard > Logs for error details
- Ensure `NEXT_PUBLIC_APP_URL` matches your domain

### Webhook Not Receiving Events

- Verify webhook endpoint URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Look at Stripe Dashboard > Webhooks > [endpoint] > Logs

### DNS Not Propagating

- Use [dnschecker.org](https://dnschecker.org) to verify
- Clear browser cache and try incognito mode
- DNS changes can take 5 minutes to 48 hours to propagate

---

## Environment Variables Reference

| Variable | Where to Find | Client-Safe |
|----------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API | ❌ No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe > Developers > API keys | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe > Developers > API keys | ❌ No |
| `STRIPE_WEBHOOK_SECRET` | Stripe > Webhooks > [endpoint] | ❌ No |
| `NEXT_PUBLIC_APP_URL` | Your domain | ✅ Yes |

---

## Why Vercel?

HillSignal is built with Next.js, and Vercel is the optimal deployment platform because:

- **Zero Configuration**: Next.js apps deploy automatically with no setup
- **Edge Functions**: API routes run on the edge for low latency
- **Automatic SSL**: Free SSL certificates for all domains
- **Preview Deployments**: Every PR gets a unique preview URL
- **Analytics**: Built-in Web Vitals and analytics
- **Global CDN**: Content delivered from edge locations worldwide

---

## Support

If you encounter issues:
1. Check Vercel deployment logs: Project > Deployments > View Logs
2. Check Supabase logs: Database > Logs
3. Check Stripe logs: Developers > Logs
4. Email: support@hillsignal.com
