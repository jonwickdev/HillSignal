/**
 * HillSignal Type Definitions
 */

export interface User {
  id: string
  email: string
  created_at: string
  is_founding_member: boolean
  subscription_tier: string | null
  subscription_status: string | null
}

export interface UserPreferences {
  id: string
  user_id: string
  sectors: string[]
  email_frequency: 'instant' | 'daily' | 'weekly'
  high_impact_alerts: boolean
  sector_alerts: boolean
  daily_digest: boolean
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  user_id: string
  stripe_payment_intent_id: string
  stripe_customer_id: string | null
  amount: number
  tier_name: string
  payment_type: 'one_time' | 'recurring'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
}

export interface Signal {
  id: string
  event_type: 'bill' | 'hearing' | 'vote' | 'amendment' | 'committee_action' | 'floor_action' | 'contract_award'
  title: string
  summary: string
  full_analysis: string | null
  impact_score: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  affected_sectors: string[]
  tickers: string[]
  source_url: string | null
  congress_gov_id: string | null
  bill_number: string | null
  committee: string | null
  legislators: string[]
  event_date: string
  key_takeaways: string[]
  market_implications: string | null
  created_at: string
  updated_at: string
}

export interface PricingTier {
  min: number
  max: number
  price: number
  name: string
  type: 'one_time' | 'recurring'
}

export interface PollState {
  id: string
  last_poll_time: string
  bills_processed: number
  votes_processed: number
  errors: string | null
}
