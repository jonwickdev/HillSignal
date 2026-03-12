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
  event_type: 'hearing' | 'vote' | 'amendment' | 'committee_action' | 'floor_action'
  title: string
  description: string
  date: string
  source: string
  committee: string | null
  sentiment: 'positive' | 'negative' | 'neutral'
  impact_score: number // 1-10
  tickers: string[]
  sectors: string[]
  summary: string
  created_at: string
}

export interface PricingTier {
  min: number
  max: number
  price: number
  name: string
  type: 'one_time' | 'recurring'
}
