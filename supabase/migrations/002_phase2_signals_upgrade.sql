-- =====================================================
-- HillSignal Database Migration: Phase 2
-- Upgrades signals table for real Congress.gov data
-- Adds poll_state table and user_preferences columns
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMNS TO SIGNALS TABLE
-- =====================================================

-- Rename 'sectors' to 'affected_sectors' for clarity
ALTER TABLE public.signals RENAME COLUMN sectors TO affected_sectors;

-- NOTE: 'description' and 'summary' both exist in original schema.
-- New code uses 'summary'. We'll keep both — 'description' stays for backward compat.

-- Add new columns
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS full_analysis TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS key_takeaways TEXT[] DEFAULT '{}';
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS market_implications TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS congress_gov_id TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS bill_number TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS legislators TEXT[] DEFAULT '{}';

-- Add unique constraint on congress_gov_id (needed for upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_signals_congress_gov_id ON public.signals(congress_gov_id) WHERE congress_gov_id IS NOT NULL;

-- =====================================================
-- 2. UPDATE CHECK CONSTRAINTS
-- =====================================================

-- Drop old event_type constraint and add new one (includes 'bill')
ALTER TABLE public.signals DROP CONSTRAINT IF EXISTS signals_event_type_check;
ALTER TABLE public.signals ADD CONSTRAINT signals_event_type_check 
  CHECK (event_type IN ('bill', 'hearing', 'vote', 'amendment', 'committee_action', 'floor_action'));

-- Drop old sentiment constraint and add new one (bullish/bearish instead of positive/negative)
ALTER TABLE public.signals DROP CONSTRAINT IF EXISTS signals_sentiment_check;
ALTER TABLE public.signals ADD CONSTRAINT signals_sentiment_check 
  CHECK (sentiment IN ('bullish', 'bearish', 'neutral', 'positive', 'negative'));

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR SIGNALS
-- Allow all authenticated users to read signals (remove is_published check)
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view published signals" ON public.signals;

CREATE POLICY "Authenticated users can view signals" ON public.signals
  FOR SELECT TO authenticated
  USING (true);

-- Allow service role to insert/update (for poll-congress cron)
-- Service role bypasses RLS by default, but be explicit
CREATE POLICY "Service role can manage signals" ON public.signals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. CREATE POLL_STATE TABLE
-- Tracks Congress.gov polling state
-- =====================================================

CREATE TABLE IF NOT EXISTS public.poll_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  last_poll_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  bills_processed INTEGER DEFAULT 0,
  votes_processed INTEGER DEFAULT 0,
  errors TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS for poll_state (service role only - bypasses RLS)
ALTER TABLE public.poll_state ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read poll state
CREATE POLICY "Authenticated users can view poll state" ON public.poll_state
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 5. ADD NEW COLUMNS TO USER_PREFERENCES
-- =====================================================

ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS high_impact_alerts BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS sector_alerts BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS daily_digest BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 6. CREATE INDEX FOR NEW COLUMNS
-- =====================================================

-- Drop old sectors index (column was renamed) and recreate
DROP INDEX IF EXISTS idx_signals_sectors;
CREATE INDEX IF NOT EXISTS idx_signals_affected_sectors ON public.signals USING GIN(affected_sectors);
CREATE INDEX IF NOT EXISTS idx_signals_event_date_desc ON public.signals(event_date DESC);
