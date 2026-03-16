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
}

function getApiKey(): string {
  return process.env.CONGRESS_API_KEY ?? ''
}

async function fetchWithRetry(url: string, retries: number = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
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

export async function fetchRecentBills(fromDateTime?: string, limit: number = 50): Promise<RawCongressItem[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('CONGRESS_API_KEY not configured')

  let url = `${BASE_URL}/bill?api_key=${apiKey}&format=json&sort=updateDate+desc&limit=${limit}`
  if (fromDateTime) {
    url += `&fromDateTime=${fromDateTime}`
  }

  const data = await fetchWithRetry(url)
  const bills: any[] = data?.bills ?? []

  const results: RawCongressItem[] = []

  for (const bill of bills?.slice?.(0, 20) ?? []) {
    // Fetch bill details for richer data
    let detail: any = null
    try {
      const detailUrl = `${BASE_URL}/bill/${bill?.congress}/${bill?.type?.toLowerCase?.()}/${bill?.number}?api_key=${apiKey}&format=json`
      const detailData = await fetchWithRetry(detailUrl)
      detail = detailData?.bill ?? null
    } catch {
      // Use basic bill data if detail fetch fails
    }

    const sponsors = detail?.sponsors ?? []
    const policyArea = detail?.policyArea?.name ?? bill?.policyArea?.name ?? null
    const billNumber = `${bill?.type ?? ''}${bill?.number ?? ''}`
    const congressGovUrl = `https://www.congress.gov/bill/${bill?.congress ?? '119'}th-congress/${(bill?.originChamber ?? 'house')?.toLowerCase?.()}-bill/${bill?.number ?? ''}`

    results.push({
      type: 'bill',
      raw: detail ?? bill,
      congress_gov_id: `bill-${bill?.congress}-${billNumber}`,
      title: bill?.title ?? 'Untitled Bill',
      description: [
        bill?.latestAction?.text ?? '',
        policyArea ? `Policy Area: ${policyArea}` : '',
        sponsors?.length ? `Sponsors: ${sponsors?.map?.((s: any) => `${s?.fullName ?? 'Unknown'} (${s?.party ?? '?'}-${s?.state ?? '?'})`)?.join?.(', ')}` : '',
        detail?.cosponsors?.count ? `Cosponsors: ${detail?.cosponsors?.count}` : '',
      ]?.filter?.(Boolean)?.join?.('\n') ?? '',
      date: bill?.latestAction?.actionDate ?? bill?.updateDate ?? new Date().toISOString(),
      source_url: congressGovUrl,
      committee: null,
      legislators: sponsors?.map?.((s: any) => `${s?.fullName ?? 'Unknown'} (${s?.party ?? '?'}-${s?.state ?? '?'})`) ?? [],
      bill_number: billNumber,
    })
  }

  return results
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

    return (meetings ?? [])?.map?.((meeting: any) => ({
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

  try {
    const bills = await fetchRecentBills(fromDateTime, 30)
    results.push(...(bills ?? []))
  } catch (err: any) {
    console.error('Failed to fetch bills:', err?.message)
  }

  try {
    const votes = await fetchRecentVotes(10)
    results.push(...(votes ?? []))
  } catch (err: any) {
    console.error('Failed to fetch votes:', err?.message)
  }

  try {
    const meetings = await fetchCommitteeMeetings(10)
    results.push(...(meetings ?? []))
  } catch (err: any) {
    console.error('Failed to fetch meetings:', err?.message)
  }

  return results
}
