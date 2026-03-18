/**
 * Congress.gov API v3 Client
 * Fetches bills, votes, and committee meetings from Congress.gov
 */

const BASE_URL = 'https://api.congress.gov/v3'

interface CongressBill {
  congress: number
  number: string
  type: string
  title: string
  originChamber: string
  updateDate: string
  latestAction: {
    actionDate: string
    text: string
  } | null
  url: string
  policyArea?: { name: string } | null
  sponsors?: Array<{
    bioguideId: string
    fullName: string
    party: string
    state: string
  }>
  cosponsors?: { count: number }
  subjects?: {
    legislativeSubjects?: Array<{ name: string }>
  }
  committees?: {
    count: number
    url: string
  }
  summaries?: Array<{
    text: string
    actionDate: string
    versionCode: string
  }>
}

interface CongressVote {
  congress: number
  chamber: string
  date: string
  rollNumber: number
  question: string
  result: string
  description: string
  url: string
  sessionNumber: number
  totals?: {
    yea: number
    nay: number
    present: number
    notVoting: number
  }
}

interface CongressMeeting {
  eventId: number
  title: string
  chamber: string
  date: string
  url: string
  committees?: Array<{ name: string; systemCode: string }>
  meetingStatus: string
}

export interface RawCongressItem {
  type: 'bill' | 'vote' | 'meeting'
  raw: any
  congress_gov_id: string
  title: string
  description: string
  date: string
  source_url: string
  committee: string | null
  legislators: string[]
  bill_number: string | null
  enrichment?: string | null
}

function getApiKey(): string {
  return process.env.CONGRESS_API_KEY ?? ''
}

async function fetchWithRetry(url: string, retries: number = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!response?.ok) {
        if (response?.status === 429 && i < retries) {
          await new Promise(r => setTimeout(r, 2000 * (i + 1)))
          continue
        }
        throw new Error(`Congress API error: ${response?.status} ${response?.statusText}`)
      }
      return await response?.json?.()
    } catch (err: any) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

export async function fetchRecentBills(fromDateTime?: string, limit: number = 20, toDateTime?: string): Promise<RawCongressItem[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('CONGRESS_API_KEY not configured')

  // Congress.gov allows up to 250 per request, 5000 req/hr
  const fetchLimit = Math.min(limit, 250)
  let url = `${BASE_URL}/bill?api_key=${apiKey}&format=json&sort=updateDate+desc&limit=${fetchLimit}`
  if (fromDateTime) {
    url += `&fromDateTime=${encodeURIComponent(fromDateTime)}`
  }
  if (toDateTime) {
    url += `&toDateTime=${encodeURIComponent(toDateTime)}`
  }

  console.log(`[congress] Fetching up to ${fetchLimit} bills...`)
  const data = await fetchWithRetry(url)
  const bills: any[] = data?.bills ?? []
  console.log(`[congress] Got ${bills?.length ?? 0} bills from list endpoint`)

  // Filter out stale bills — if the latest action is >6 months old, skip it.
  // Congress.gov returns bills updated recently but some have very old action dates.
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const freshBills = (bills ?? []).filter((bill: any) => {
    const actionDate = bill?.latestAction?.actionDate ?? bill?.updateDate
    if (!actionDate) return true // keep if no date
    const d = new Date(actionDate)
    if (isNaN(d.getTime())) return true // keep if unparseable
    return d >= sixMonthsAgo
  })
  console.log(`[congress] ${freshBills.length}/${bills.length} bills passed staleness filter (>6 months removed)`)

  // Use list data directly — NO individual detail fetches (saves 10-20 HTTP calls)
  return (freshBills ?? []).map((bill: any) => {
    const policyArea = bill?.policyArea?.name ?? null
    const billNumber = `${bill?.type ?? ''}${bill?.number ?? ''}`
    const chamber = (bill?.originChamber ?? 'house')?.toLowerCase?.()
    const congressGovUrl = `https://www.congress.gov/bill/${bill?.congress ?? '119'}th-congress/${chamber}-bill/${bill?.number ?? ''}`

    return {
      type: 'bill' as const,
      raw: bill,
      congress_gov_id: `bill-${bill?.congress}-${billNumber}`,
      title: bill?.title ?? 'Untitled Bill',
      description: [
        bill?.latestAction?.text ?? '',
        policyArea ? `Policy Area: ${policyArea}` : '',
      ].filter(Boolean).join('\n'),
      date: bill?.latestAction?.actionDate ?? bill?.updateDate ?? new Date().toISOString(),
      source_url: congressGovUrl,
      committee: null,
      legislators: [],
      bill_number: billNumber,
    }
  })
}

export async function fetchRecentVotes(limit: number = 20): Promise<RawCongressItem[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('CONGRESS_API_KEY not configured')

  const url = `${BASE_URL}/house-vote/119?api_key=${apiKey}&format=json&limit=${limit}&sort=date+desc`

  const data = await fetchWithRetry(url)
  const votes: any[] = data?.houseVotes ?? data?.votes ?? []

  return (votes ?? [])?.map?.((vote: any) => ({
    type: 'vote' as const,
    raw: vote,
    congress_gov_id: `vote-119-${vote?.rollNumber ?? 'unknown'}`,
    title: vote?.question ?? vote?.description ?? 'House Vote',
    description: [
      vote?.description ?? '',
      vote?.result ? `Result: ${vote?.result}` : '',
      vote?.totals ? `Yea: ${vote?.totals?.yea ?? 0}, Nay: ${vote?.totals?.nay ?? 0}` : '',
    ]?.filter?.(Boolean)?.join?.('\n') ?? '',
    date: vote?.date ?? new Date().toISOString(),
    source_url: vote?.url ?? `https://clerk.house.gov/evs/2026/roll${vote?.rollNumber ?? ''}.xml`,
    committee: null,
    legislators: [],
    bill_number: null,
  })) ?? []
}

export async function fetchCommitteeMeetings(limit: number = 20): Promise<RawCongressItem[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('CONGRESS_API_KEY not configured')

  const url = `${BASE_URL}/committee-meeting/119?api_key=${apiKey}&format=json&limit=${limit}`

  try {
    const data = await fetchWithRetry(url)
    const meetings: any[] = data?.committeeMeetings ?? []

    return (meetings ?? [])
      ?.filter?.((meeting: any) => {
        // Reject meetings with no meaningful title/description
        const title = (meeting?.title ?? '')?.toLowerCase?.()?.trim?.()
        const hasGenericTitle = !title
          || title === 'committee meeting'
          || title === 'full committee'
          || title === 'subcommittee meeting'
          || title === 'hearing'
          || title === 'markup'
          || title === 'business meeting'
          || title.length < 15
        
        // If the title is generic, there's no agenda info — skip it
        if (hasGenericTitle) {
          console.log(`[congress] Skipping vague meeting: "${meeting?.title}"`)
          return false
        }
        return true
      })
      ?.map?.((meeting: any) => ({
        type: 'meeting' as const,
        raw: meeting,
        congress_gov_id: `meeting-${meeting?.eventId ?? 'unknown'}`,
        title: meeting?.title ?? 'Committee Meeting',
        description: [
          meeting?.meetingStatus ?? '',
          meeting?.committees?.map?.((c: any) => c?.name)?.join?.(', ') ?? '',
        ]?.filter?.(Boolean)?.join?.('\n') ?? '',
        date: meeting?.date ?? new Date().toISOString(),
        source_url: meeting?.url ?? '',
        committee: meeting?.committees?.[0]?.name ?? null,
        legislators: [],
        bill_number: null,
      })) ?? []
  } catch {
    return []
  }
}

export async function fetchAllRecent(fromDateTime?: string): Promise<RawCongressItem[]> {
  const results: RawCongressItem[] = []

  // Fetch bills, votes, meetings IN PARALLEL to save time on Vercel
  const [billsResult, votesResult, meetingsResult] = await Promise.allSettled([
    fetchRecentBills(fromDateTime, 100),
    fetchRecentVotes(20),
    fetchCommitteeMeetings(20),
  ])

  if (billsResult?.status === 'fulfilled') results.push(...(billsResult.value ?? []))
  else console.error('Failed to fetch bills:', (billsResult as any)?.reason?.message)

  if (votesResult?.status === 'fulfilled') results.push(...(votesResult.value ?? []))
  else console.error('Failed to fetch votes:', (votesResult as any)?.reason?.message)

  if (meetingsResult?.status === 'fulfilled') results.push(...(meetingsResult.value ?? []))
  else console.error('Failed to fetch meetings:', (meetingsResult as any)?.reason?.message)

  console.log(`[congress] fetchAllRecent total: ${results.length} items`)
  return results
}

/**
 * Parse bill type and number from raw Congress.gov bill data.
 * bill.type comes back lowercase (e.g. "hr", "s", "hjres", "sjres")
 * bill.number is the numeric portion.
 */
function parseBillInfo(bill: any): { congress: number; billType: string; billNumber: string } | null {
  const congress = bill?.congress ?? 119
  const rawType = (bill?.type ?? '')?.toLowerCase?.()?.trim?.()
  const number = bill?.number ?? ''
  if (!rawType || !number) return null
  return { congress, billType: rawType, billNumber: String(number) }
}

/**
 * Strip HTML tags from CRS summary text.
 */
function stripHtml(html: string): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fetch enrichment data for a single bill: sponsors, subjects, committees, CRS summary.
 * Uses a 5s timeout per request. Returns a formatted text block or null on failure.
 */
async function fetchBillEnrichment(bill: any): Promise<string | null> {
  const info = parseBillInfo(bill)
  if (!info) return null

  const apiKey = getApiKey()
  if (!apiKey) return null

  const { congress, billType, billNumber } = info
  const detailUrl = `${BASE_URL}/bill/${congress}/${billType}/${billNumber}?api_key=${apiKey}&format=json`
  const summaryUrl = `${BASE_URL}/bill/${congress}/${billType}/${billNumber}/summaries?api_key=${apiKey}&format=json`

  const parts: string[] = []

  try {
    // Fetch detail + summary in parallel with 5s timeout each
    const [detailResult, summaryResult] = await Promise.allSettled([
      fetch(detailUrl, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) })
        .then(r => r?.ok ? r.json() : null),
      fetch(summaryUrl, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) })
        .then(r => r?.ok ? r.json() : null),
    ])

    // Extract detail info
    if (detailResult?.status === 'fulfilled' && detailResult.value) {
      const d = detailResult.value?.bill ?? {}

      // Sponsors
      const sponsors = d?.sponsors ?? []
      if (sponsors.length > 0) {
        const sponsorList = sponsors.map((s: any) =>
          `${s?.fullName ?? 'Unknown'} (${s?.party ?? '?'}-${s?.state ?? '?'})`
        ).join(', ')
        parts.push(`Sponsors: ${sponsorList}`)
      }

      // Cosponsor count
      const coCount = d?.cosponsors?.count ?? 0
      if (coCount > 0) {
        parts.push(`Cosponsors: ${coCount}`)
      }

      // Policy area
      if (d?.policyArea?.name) {
        parts.push(`Policy Area: ${d.policyArea.name}`)
      }

      // Committees
      if (d?.committees?.count > 0) {
        // committees.url is a link to fetch the list — just note the count
        parts.push(`Referred to ${d.committees.count} committee(s)`)
      }

      // Legislative subjects
      const subjects = d?.subjects?.legislativeSubjects ?? []
      if (subjects.length > 0) {
        parts.push(`Subjects: ${subjects.map((s: any) => s?.name).filter(Boolean).join(', ')}`)
      }
    }

    // Extract CRS summary
    if (summaryResult?.status === 'fulfilled' && summaryResult.value) {
      const summaries = summaryResult.value?.summaries ?? []
      // Use the most recent summary (last in array)
      const latest = summaries[summaries.length - 1]
      if (latest?.text) {
        const cleanText = stripHtml(latest.text)
        // Truncate to ~800 chars to fit in prompt without blowing token budget
        const trimmed = cleanText.length > 800 ? cleanText.slice(0, 800) + '...' : cleanText
        parts.push(`CRS Summary: ${trimmed}`)
      }
    }
  } catch (err: any) {
    console.log(`[congress] Enrichment failed for ${billType}${billNumber}: ${err?.message}`)
    return null
  }

  if (parts.length === 0) return null
  return parts.join('\n')
}

/**
 * Enrich bill items with full detail data (sponsors, subjects, CRS summaries).
 * Non-bill items pass through unchanged. Enrichment failures are silent (item keeps original data).
 * Runs enrichment in parallel with a cap of 5 concurrent requests.
 */
export async function enrichBillItems(items: RawCongressItem[]): Promise<RawCongressItem[]> {
  const bills = items.filter(i => i.type === 'bill')
  const nonBills = items.filter(i => i.type !== 'bill')

  if (bills.length === 0) return items

  console.log(`[congress] Enriching ${bills.length} bills with detail data...`)
  const startMs = Date.now()

  // Process in chunks of 5 to avoid hammering the API
  const enriched: RawCongressItem[] = []
  for (let i = 0; i < bills.length; i += 5) {
    const chunk = bills.slice(i, i + 5)
    const results = await Promise.allSettled(
      chunk.map(async (item) => {
        const text = await fetchBillEnrichment(item.raw)
        return { ...item, enrichment: text }
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled') {
        enriched.push(r.value)
      } else {
        // If enrichment failed, keep original item
        enriched.push(chunk[results.indexOf(r)])
      }
    }
  }

  const elapsed = Date.now() - startMs
  const enrichedCount = enriched.filter(b => b.enrichment).length
  console.log(`[congress] Enrichment done: ${enrichedCount}/${bills.length} bills enriched in ${elapsed}ms`)

  return [...enriched, ...nonBills]
}
