import Stripe from 'stripe'

function getStripeInstance(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { typescript: true })
}

export const stripe = getStripeInstance()

export const PRICING_TIERS = [
  { min: 0, max: 1000, price: 500, name: 'Founding Member', type: 'one_time' as const },
  { min: 1001, max: 3000, price: 900, name: 'Early Adopter', type: 'one_time' as const },
  { min: 3001, max: 5000, price: 1500, name: 'Growth', type: 'one_time' as const },
  { min: 5001, max: Infinity, price: 1900, name: 'Standard', type: 'recurring' as const },
] as const

export function getCurrentTier(purchaseCount: number) {
  return PRICING_TIERS?.find?.((tier: any) =>
    purchaseCount >= tier?.min && purchaseCount <= tier?.max
  ) ?? PRICING_TIERS[PRICING_TIERS?.length - 1]
}

export function getSpotsRemaining(purchaseCount: number): number {
  const tier = getCurrentTier(purchaseCount)
  if (tier?.max === Infinity) return -1
  return (tier?.max ?? 0) - purchaseCount
}

export function formatPrice(cents: number): string {
  return `$${((cents ?? 0) / 100).toFixed(0)}`
}
