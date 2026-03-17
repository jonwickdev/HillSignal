/**
 * USAspending.gov API Client
 * Fetches federal contract awards for analysis.
 * Free API — no authentication required.
 */

import type { RawContractItem } from '@/lib/gemini-analysis'

const BASE_URL = 'https://api.usaspending.gov/api/v2'

/**
 * Fetch recent contract awards from USAspending.gov.
 * @param sinceDate ISO date string (YYYY-MM-DD). Defaults to 7 days ago.
 * @param minAmount Minimum award amount in dollars. Default $25M.
 * @param limit Max results to return. Default 30.
 */
export async function fetchRecentContracts(
  sinceDate?: string,
  minAmount: number = 25_000_000,
  limit: number = 30
): Promise<RawContractItem[]> {
  // Default to 7 days ago
  const since = sinceDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  console.log(`[usaspending] Fetching contracts since ${since}, min $${(minAmount / 1_000_000).toFixed(0)}M...`)

  const payload = {
    filters: {
      time_period: [{ start_date: since, end_date: today }],
      award_type_codes: ['A', 'B', 'C', 'D'], // All contract types
      award_amounts: [{ lower_bound: minAmount }],
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Start Date',
      'End Date',
      'Award Amount',
      'Awarding Agency',
      'Awarding Sub Agency',
      'Contract Award Type',
      'Description',
      'NAICS Code',
      'generated_internal_id',
    ],
    sort: 'Award Amount',
    order: 'desc',
    limit,
    page: 1,
  }

  try {
    const response = await fetch(`${BASE_URL}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`USAspending API ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    const results: any[] = data?.results ?? []
    console.log(`[usaspending] Got ${results.length} contracts`)

    return results.map((r: any) => ({
      award_id: r['Award ID'] ?? '',
      recipient_name: r['Recipient Name'] ?? 'Unknown',
      description: r['Description'] ?? '',
      award_amount: parseFloat(r['Award Amount']) || 0,
      awarding_agency: r['Awarding Agency'] ?? '',
      awarding_sub_agency: r['Awarding Sub Agency'] ?? '',
      contract_type: r['Contract Award Type'] ?? '',
      naics_code: r['NAICS Code'] ?? null,
      start_date: r['Start Date'] ?? '',
      end_date: r['End Date'] ?? null,
      source_url: `https://www.usaspending.gov/award/${r['generated_internal_id'] ?? ''}`,
      generated_internal_id: r['generated_internal_id'] ?? '',
    }))
  } catch (err: any) {
    console.error('[usaspending] Fetch failed:', err?.message)
    return []
  }
}
