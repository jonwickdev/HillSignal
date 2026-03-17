/**
 * USAspending.gov API Client
 * Fetches federal contract awards for analysis.
 * Free API — no authentication required.
 */

import type { RawContractItem } from '@/lib/gemini-analysis'

const BASE_URL = 'https://api.usaspending.gov/api/v2'

/**
 * NAICS code mapping for sector-targeted contract fetching.
 * Each sector maps to the primary NAICS codes where public companies compete.
 */
export const SECTOR_NAICS_MAP: Record<string, string[]> = {
  Technology: ['5112', '5415', '5182', '5191', '5413', '3341', '3342', '3344'],
  Healthcare: ['3254', '6211', '6214', '6215', '6219', '3391', '3256', '6216'],
  Defense: ['3364', '3369', '9271', '3329', '3489', '3345', '9261'],
  Energy: ['2111', '2211', '2212', '3241', '5629', '3211', '2131'],
  Finance: ['5221', '5222', '5231', '5239', '5241', '5242'],
  Infrastructure: ['2371', '2372', '2373', '2379', '2362', '2361', '2381'],
  Telecommunications: ['5173', '5174', '5179', '3342', '5171', '5172'],
  Agriculture: ['1111', '1112', '1119', '1151', '3111', '3112', '3114'],
  Manufacturing: ['3311', '3312', '3313', '3321', '3331', '3361', '3363'],
  Transportation: ['4811', '4812', '4821', '4841', '4862', '4831', '4882'],
  Consumer: ['4451', '4452', '4511', '4512', '4521', '4532', '4539'],
  'Real Estate': ['5311', '5312', '5313', '5321', '5322', '5323'],
}

/**
 * Fetch recent contract awards from USAspending.gov.
 * @param sinceDate ISO date string (YYYY-MM-DD). Defaults to 7 days ago.
 * @param minAmount Minimum award amount in dollars. Default $25M.
 * @param limit Max results to return. Default 75.
 * @param naicsCodes Optional NAICS codes to filter by specific sectors.
 */
export async function fetchRecentContracts(
  sinceDate?: string,
  minAmount: number = 25_000_000,
  limit: number = 75,
  naicsCodes?: string[]
): Promise<RawContractItem[]> {
  // Default to 7 days ago
  const since = sinceDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const naicsLabel = naicsCodes?.length ? ` (NAICS: ${naicsCodes.join(',')})` : ''
  console.log(`[usaspending] Fetching contracts since ${since}, min $${(minAmount / 1_000_000).toFixed(0)}M${naicsLabel}...`)

  const filters: any = {
    time_period: [{ start_date: since, end_date: today }],
    award_type_codes: ['A', 'B', 'C', 'D'], // All contract types
    award_amounts: [{ lower_bound: minAmount }],
  }
  if (naicsCodes && naicsCodes.length > 0) {
    filters.naics_codes = naicsCodes
  }

  const payload = {
    filters,
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

/**
 * Fetch contracts across multiple sectors in parallel.
 * Runs one fetch per sector using NAICS codes, then deduplicates by award ID.
 * Uses lower minimum amount ($10M) for targeted sector fetches to catch
 * contracts that are significant within their sector even if not huge overall.
 */
export async function fetchSectorContracts(
  sectors: string[],
  sinceDate?: string,
  limitPerSector: number = 15
): Promise<RawContractItem[]> {
  const validSectors = sectors.filter(s => SECTOR_NAICS_MAP[s])
  if (validSectors.length === 0) return []

  console.log(`[usaspending] Sector-targeted fetch for: ${validSectors.join(', ')}`)

  // Run sector fetches in parallel (max 4 concurrent to be polite to the API)
  const allResults: RawContractItem[] = []
  for (let i = 0; i < validSectors.length; i += 4) {
    const chunk = validSectors.slice(i, i + 4)
    const results = await Promise.allSettled(
      chunk.map(sector =>
        fetchRecentContracts(sinceDate, 10_000_000, limitPerSector, SECTOR_NAICS_MAP[sector])
      )
    )
    for (const r of results) {
      if (r.status === 'fulfilled') {
        allResults.push(...r.value)
      }
    }
  }

  // Deduplicate by generated_internal_id
  const seen = new Set<string>()
  const deduped: RawContractItem[] = []
  for (const item of allResults) {
    if (!seen.has(item.generated_internal_id)) {
      seen.add(item.generated_internal_id)
      deduped.push(item)
    }
  }

  console.log(`[usaspending] Sector fetch: ${allResults.length} raw → ${deduped.length} unique contracts`)
  return deduped
}
