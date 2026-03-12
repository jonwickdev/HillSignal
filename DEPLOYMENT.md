# HillSignal Deployment Guide

This guide walks you through deploying HillSignal to Railway with Supabase and Stripe integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Stripe Setup](#stripe-setup)
4. [Railway Deployment](#railway-deployment)
5. [Domain Configuration (Namecheap)](#domain-configuration-namecheap)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Supabase account](https://supabase.com) (free tier works)
- [Stripe account](https://stripe.com) (free to create)
- [Railway account](https://railway.app) (free tier available)
- Domain registered with Namecheap (hillsignal.com)
- Git installed locally

---

## Supabase Setup

### Step 1: Get Your API Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Project Settings** (gear icon in sidebar)
4. Click on **API** in the left menu

You'll see:
- **Project URL**: `https://oiwuwllrtjiqrpmadqiu.supabase.co`
- **anon public key**: Safe to use in client-side code
- **service_role key**: ⚠️ **KEEP SECRET** - Only use server-side

### Step 2: Find the Service Role Key

> ⚠️ **IMPORTANT**: The service_role key bypasses Row Level Security. Never expose it in client-side code.

1. In Supabase Dashboard, go to **Project Settings** > **API**
2. Scroll down to **Project API keys**
3. Find `service_role` (it says "This key has the ability to bypass Row Level Security")
4. Click the eye icon to reveal it, or click "Copy"
5. Save this securely - you'll need it for Railway

### Step 3: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
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

You'll complete this step after deploying to Railway:

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
8. Add this as `STRIPE_WEBHOOK_SECRET` in Railway

### Step 3: Test Mode vs Live Mode

- **Test Mode** (default): Use `pk_test_` and `sk_test_` keys. Payments are simulated.
- **Live Mode**: Use `pk_live_` and `sk_live_` keys. Real payments processed.

To switch, toggle **Test mode** in the Stripe Dashboard header.

---

## Railway Deployment

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click **New Project**
3. Choose one of:
   - **Deploy from GitHub repo** (recommended)
   - **Deploy from CLI**

### Step 2: Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. In Railway, select **Deploy from GitHub repo**
3. Connect your GitHub account if not already
4. Select the `hillsignal` repository
5. Railway will auto-detect it's a Next.js app

### Step 3: Add Environment Variables

1. In Railway, click on your service
2. Go to **Variables** tab
3. Add each variable from `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://oiwuwllrtjiqrpmadqiu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://hillsignal.com
NODE_ENV=production
```

4. Click **Deploy** to redeploy with the new variables

### Step 4: Verify Deployment

1. Railway will provide a temporary URL like `hillsignal-production.up.railway.app`
2. Visit `your-url.railway.app/api/health` - should return `{"status":"healthy"}`
3. Test the landing page loads correctly

---

## Domain Configuration (Namecheap)

### Step 1: Get Railway's IP/Domain

1. In Railway, go to your service
2. Click **Settings** > **Networking**
3. Under **Public Networking**, click **Generate Domain** if you haven't
4. Note the Railway URL: `hillsignal-production.up.railway.app`

### Step 2: Add Custom Domain in Railway

1. In **Settings** > **Networking** > **Custom Domain**
2. Enter `hillsignal.com`
3. Railway will show you the required DNS records

### Step 3: Configure Namecheap DNS

1. Log in to [Namecheap](https://namecheap.com)
2. Go to **Domain List** > find `hillsignal.com` > **Manage**
3. Click **Advanced DNS** tab
4. Delete any existing A, AAAA, or CNAME records for `@` and `www`
5. Add the following records:

**For root domain (hillsignal.com):**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | hillsignal-production.up.railway.app | Automatic |

> ⚠️ If Namecheap doesn't allow CNAME for root (@), use:
| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | [Railway IP from their docs] | Automatic |

**For www subdomain:**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | hillsignal-production.up.railway.app | Automatic |

6. Click the checkmark to save each record

### Step 4: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Use [dnschecker.org](https://dnschecker.org) to check status
- Search for `hillsignal.com` to see if it resolves correctly

### Step 5: SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt:

1. After DNS propagation, Railway will auto-generate SSL
2. Check **Settings** > **Networking** to confirm SSL status
3. Your site should be accessible at `https://hillsignal.com`

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
6. Add to Railway as `STRIPE_WEBHOOK_SECRET`
7. Redeploy

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

### "Invalid API Key" Error
- Double-check your Supabase/Stripe keys in Railway variables
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
- Try flushing DNS: `sudo dscacheutil -flushcache` (Mac)

### SSL Certificate Issues
- Ensure DNS is fully propagated first
- Check Railway Settings > Networking for SSL status
- SSL usually provisions within 10-15 minutes of DNS setup

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
| `NODE_ENV` | Set to `production` | ✅ Yes |

---

## Support

If you encounter issues:
1. Check Railway logs: Service > Deployments > View Logs
2. Check Supabase logs: Database > Logs
3. Check Stripe logs: Developers > Logs
4. Email: support@hillsignal.com
