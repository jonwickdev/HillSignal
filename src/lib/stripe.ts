import Stripe from 'stripe'

/**
 * Server-side Stripe instance
 * ONLY use this on the server - never expose to client
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})

/**
 * Tiered pricing configuration
 * Pricing tiers based on total purchase count
 */
export const PRICING_TIERS = [
  { min: 0, max: 1000, price: 500, name: 'Founding Member', type: 'one_time' as const },
  { min: 1001, max: 3000, price: 900, name: 'Early Adopter', type: 'one_time' as const },
  { min: 3001, max: 5000, price: 1500, name: 'Growth', type: 'one_time' as const },
  { min: 5001, max: Infinity, price: 1900, name: 'Standard', type: 'recurring' as const },
] as const

/**
 * Get current pricing tier based on purchase count
 */
export function getCurrentTier(purchaseCount: number) {
  return PRICING_TIERS.find(tier => 
    purchaseCount >= tier.min && purchaseCount <= tier.max
  ) || PRICING_TIERS[PRICING_TIERS.length - 1]
}

/**
 * Get spots remaining in current tier
 */
export function getSpotsRemaining(purchaseCount: number): number {
  const tier = getCurrentTier(purchaseCount)
  if (tier.max === Infinity) return -1 // Unlimited
  return tier.max - purchaseCount
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}
