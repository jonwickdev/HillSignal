-- =====================================================
-- HillSignal Database Migration: Phase 3
-- Adds user_signal_actions table for favorites and dismissals
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_signal_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('favorite', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, signal_id, action)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_signal_actions_user ON public.user_signal_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signal_actions_signal ON public.user_signal_actions(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signal_actions_user_action ON public.user_signal_actions(user_id, action);

-- RLS
ALTER TABLE public.user_signal_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions" ON public.user_signal_actions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions" ON public.user_signal_actions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions" ON public.user_signal_actions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypass (for admin operations)
CREATE POLICY "Service role can manage all actions" ON public.user_signal_actions
  FOR ALL
  USING (true)
  WITH CHECK (true);
