# HillSignal Setup Guide

## Issue 1: Supabase SQL Migration

### SQL File Contents & Explanation

The migration file (`supabase/migrations/001_initial_schema.sql`) creates the following:

---

#### 1. UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Enables UUID generation for primary keys. **Safe** - uses `IF NOT EXISTS`.

---

#### 2. Tables Created (4 total)

| Table | Purpose |
|-------|---------|
| `public.users` | Extended user profiles linked to Supabase auth |
| `public.user_preferences` | Sector preferences, email frequency settings |
| `public.purchases` | Stripe payment tracking for tiered pricing |
| `public.signals` | Congressional activity signals (Phase 2) |

All tables use `CREATE TABLE IF NOT EXISTS` - **won't overwrite existing data**.

---

#### 3. Row Level Security (RLS) Policies

| Policy | Effect |
|--------|--------|
| Users can view/update own profile | Privacy protection |
| Users can manage own preferences | Self-service settings |
| Users can view own purchases | Purchase history access |
| Authenticated + subscribed users can view signals | Paywall enforcement |

---

#### 4. Triggers & Functions

| Component | Purpose |
|-----------|---------|
| `handle_new_user()` | Auto-creates profile when user signs up |
| `update_updated_at()` | Auto-updates timestamps on record changes |
| `get_purchase_count()` | Returns total purchases (for landing page counter) |

---

### ⚠️ About the "Destructive Operations" Warning

The warning is triggered by these lines:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

**Why it's safe:**
- `DROP TRIGGER IF EXISTS` only removes the trigger if it exists, then immediately recreates it
- This is standard practice to make migrations idempotent (re-runnable)
- No data is deleted - only a trigger definition is replaced
- All `CREATE` statements use `IF NOT EXISTS` to prevent conflicts

**Verdict: ✅ SAFE TO RUN**

The migration is well-designed and won't destroy any existing data. The "destructive" warning is a generic Supabase alert for any `DROP` statement, even safe ones.

---

## Issue 2: GitHub Repository Setup

### Current Git Status

✅ **Git is already initialized** on branch `master`  
✅ **.gitignore is properly configured** - includes:
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `node_modules/`
- `.next/`

---

### Step-by-Step GitHub Setup

#### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `hillsignal` (or your preferred name)
3. Description: `Congressional activity monitoring platform`
4. **Keep it Private** (recommended for production apps)
5. **DO NOT** initialize with README, .gitignore, or license (you already have these)
6. Click **Create repository**

---

#### Step 2: Push Code to GitHub

**Option A: HTTPS (Easier - uses username/password or token)**

```bash
cd /home/ubuntu/hillsignal

# Add all files
git add .

# Commit
git commit -m "Initial commit: HillSignal Phase 1"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hillsignal.git

# Push to GitHub (will prompt for credentials)
git branch -M main
git push -u origin main
```

**Option B: SSH (More secure - uses SSH keys)**

```bash
cd /home/ubuntu/hillsignal

# Add all files
git add .

# Commit
git commit -m "Initial commit: HillSignal Phase 1"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin git@github.com:YOUR_USERNAME/hillsignal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

#### Step 3: Verify Push

After pushing, check your repository at:
```
https://github.com/YOUR_USERNAME/hillsignal
```

Confirm these are **NOT** visible in the repo:
- [ ] No `.env` files
- [ ] No `node_modules/` folder
- [ ] No `.next/` folder

---

### Quick Reference: All Commands

```bash
# Navigate to project
cd /home/ubuntu/hillsignal

# Stage all files
git add .

# Commit changes
git commit -m "Initial commit: HillSignal Phase 1"

# Add GitHub remote (HTTPS - replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/hillsignal.git

# Rename branch to main and push
git branch -M main
git push -u origin main
```

---

### Railway Deployment Next Steps

Once pushed to GitHub:
1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `hillsignal` repository
4. Railway will auto-detect it's a Next.js app
5. Add environment variables in Railway dashboard (copy from your `.env.local`)

---

## Summary Checklist

- [x] SQL migration reviewed - **safe to run**
- [x] Git already initialized
- [x] .gitignore properly excludes sensitive files
- [x] Branch: use `main` (renamed from master)
- [ ] Create GitHub repo
- [ ] Push code
- [ ] Deploy to Railway
