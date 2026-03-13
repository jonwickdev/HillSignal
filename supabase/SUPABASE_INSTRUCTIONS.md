# HillSignal Supabase Database Setup Instructions

## Overview

This guide walks you through setting up the HillSignal database in Supabase. Follow each step carefully.

---

## Prerequisites

- A Supabase account at [supabase.com](https://supabase.com)
- A Supabase project created
- Access to your project's SQL Editor

---

## Step-by-Step Instructions

### Step 1: Open the SQL Editor

1. Go to [supabase.com](https://supabase.com) and log in
2. Select your **HillSignal project** from the dashboard
3. In the left sidebar, click **"SQL Editor"** (icon looks like `</>`)
4. You should see a blank editor with a "Run" button

**What you should see:**
- A text area where you can write SQL
- A green "Run" button in the top right
- Query results area below the editor

---

### Step 2: Copy the SQL Code

1. Open the file: `supabase/SUPABASE_SETUP.sql`
2. Select ALL the content (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)

---

### Step 3: Paste and Run the SQL

1. In the Supabase SQL Editor, click in the text area
2. Paste the SQL (Ctrl+V / Cmd+V)
3. Click the **green "Run"** button (or press Ctrl+Enter / Cmd+Enter)

**What you should see:**
```
Success. No rows returned
```

This is **CORRECT**! The SQL creates tables and doesn't return data rows.

---

### Step 4: Verify Tables Were Created

After running the main SQL, run this verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Result:**
| table_name        |
|-------------------|
| purchases         |
| signals           |
| user_preferences  |
| users             |

If you see these 4 tables, your database is set up correctly!

---

### Step 5: Verify RLS Policies

Run this query to confirm Row Level Security policies exist:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:**
| tablename        | policyname                                      |
|------------------|-------------------------------------------------|
| purchases        | Users can view own purchases                    |
| signals          | Authenticated users can view published signals  |
| user_preferences | Users can insert own preferences                |
| user_preferences | Users can update own preferences                |
| user_preferences | Users can view own preferences                  |
| users            | Users can update own profile                    |
| users            | Users can view own profile                      |

---

### Step 6: Verify Functions

Run this query to confirm functions were created:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Expected Result:**
| routine_name       |
|--------------------|
| get_purchase_count |
| handle_new_user    |
| update_updated_at  |

---

### Step 7: Test the Purchase Count Function

```sql
SELECT public.get_purchase_count();
```

**Expected Result:**
| get_purchase_count |
|--------------------|
| 0                  |

This returns 0 because there are no purchases yet.

---

### Step 8: Verify via Table Editor (Optional)

1. In the left sidebar, click **"Table Editor"**
2. You should see your 4 tables listed:
   - `users`
   - `user_preferences`
   - `purchases`
   - `signals`
3. Click on any table to see its structure and columns

---

## Common Errors and Solutions

### Error: "relation 'auth.users' does not exist"

**Cause:** Running SQL before Supabase auth is set up.

**Solution:** This error shouldn't occur in a properly configured Supabase project. If it does, ensure you're in a Supabase project (not a plain PostgreSQL database).

---

### Error: "permission denied for schema auth"

**Cause:** Trying to modify auth schema without proper permissions.

**Solution:** The SQL is designed to work with default Supabase permissions. If this error occurs, check that you're using the SQL Editor in your Supabase Dashboard (not an external connection).

---

### Error: "relation already exists"

**Cause:** Tables were already created from a previous run.

**Solution:** The SQL includes `DROP TABLE IF EXISTS` statements at the beginning, so re-running should work. If you still get this error, manually drop the tables first:

```sql
DROP TABLE IF EXISTS public.signals CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

Then run the setup SQL again.

---

### Error: "function uuid_generate_v4() does not exist"

**Cause:** UUID extension not enabled.

**Solution:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### Result: "Success. No rows returned" but tables don't appear

**Cause:** You might be looking in the wrong schema or the page needs refresh.

**Solution:**
1. Refresh your browser (Ctrl+R / Cmd+R)
2. Run the verification query from Step 4
3. Check that you're looking at the `public` schema in Table Editor

---

### Error: "trigger already exists"

**Cause:** Trigger was created from a previous run.

**Solution:** The SQL includes `DROP TRIGGER IF EXISTS` statements. If this still occurs, manually drop triggers:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

---

## Verifying Everything Works

### Full Verification Script

Run this complete verification script:

```sql
-- Check tables
SELECT 'Tables' as check_type, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'

UNION ALL

-- Check policies
SELECT 'RLS Policies', COUNT(*) 
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

-- Check functions
SELECT 'Functions', COUNT(*) 
FROM information_schema.routines 
WHERE routine_schema = 'public'

UNION ALL

-- Check triggers
SELECT 'Triggers', COUNT(*) 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

**Expected Result:**
| check_type   | count |
|--------------|-------|
| Tables       | 4     |
| RLS Policies | 7     |
| Functions    | 3     |
| Triggers     | 4     |

---

## Next Steps After Database Setup

1. **Get your API keys** from Supabase:
   - Go to **Settings** → **API**
   - Copy the `URL`, `anon key`, and `service_role key`

2. **Update your `.env.local`** file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Test authentication**:
   - Try signing up a user through your app
   - Check the `users` table to see if a row was created

---

## Database Schema Overview

### Tables

| Table             | Purpose                                    |
|-------------------|--------------------------------------------|
| `users`           | User profiles (linked to auth.users)       |
| `user_preferences`| User sector preferences and email settings |
| `purchases`       | Payment history for tiered pricing         |
| `signals`         | Congressional activity signals (Phase 2)   |

### Key Relationships

```
auth.users (Supabase built-in)
    ↓
public.users (id references auth.users.id)
    ↓
public.user_preferences (user_id references users.id)
    ↓
public.purchases (user_id references users.id)
```

### Important Functions

| Function            | Purpose                                      |
|---------------------|----------------------------------------------|
| `handle_new_user()` | Auto-creates user profile on signup          |
| `update_updated_at()`| Auto-updates timestamp on record changes    |
| `get_purchase_count()`| Returns total completed purchases (pricing)|

---

## Troubleshooting Checklist

- [ ] Are you in the correct Supabase project?
- [ ] Did you paste the ENTIRE SQL file?
- [ ] Did you click "Run" (not just paste)?
- [ ] Did you refresh the page after running?
- [ ] Are you looking at the `public` schema?
- [ ] Did the verification queries return expected results?

---

## Getting Help

If you're still having issues:

1. **Check Supabase Logs**: Go to **Logs** in the sidebar to see any errors
2. **Check the SQL Editor history**: Click the clock icon to see past queries
3. **Try running statements one at a time**: If the full script fails, try running each `CREATE TABLE` statement separately to identify which one fails

---

## Quick Reference

### SQL File Location
```
supabase/SUPABASE_SETUP.sql
```

### Verification Query
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

### Expected Tables
- `users`
- `user_preferences`
- `purchases`
- `signals`
