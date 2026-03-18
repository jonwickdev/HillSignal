/**
 * AI Analysis Engine — RouteLLM via Abacus AI
 * Powers bill analysis and contract award analysis for HillSignal.
 */

import type { Signal } from '@/lib/types'
import type { RawCongressItem } from '@/lib/congress-api'

/**
 * Format a dollar amount for display.
 * $10,410,500,000 → "$10.4B"
 * $250,000,000 → "$250M"
 * $15,500,000 → "$15.5M"
 */
export function formatDollarAmount(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) {
    const billions = abs / 1_000_000_000
    return `$${billions >= 100 ? billions.toFixed(0) : billions.toFixed(1)}B`
  }
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    return `$${millions >= 100 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `$${(abs / 1_000).toFixed(0)}K`
  }
  return `$${abs.toFixed(0)}`
}

export interface RawContractItem {
  award_id: string
  recipient_name: string
  description: string
  award_amount: number
  awarding_agency: string
  awarding_sub_agency: string
  contract_type: string
  naics_code: string | null
  start_date: string
  end_date: string | null
  source_url: string
  generated_internal_id: string
}

const ANALYSIS_PROMPT = `You are a non-partisan Congressional market intelligence analyst writing for retail investors. Your job is to deliver direct, actionable analysis. No hedging. No "could potentially" or "may somewhat" or "remains to be seen." State what IS happening, what HAS happened historically, and what specific companies stand to gain or lose.

CONGRESSIONAL EVENT:
Type: {type}
Title: {title}
Details: {description}
Date: {date}
Bill Number: {bill_number}
Committee: {committee}
Legislators: {legislators}
{enrichment_block}

ANALYSIS RULES — FOLLOW EXACTLY:
1. NO HEDGING. Never write "could potentially", "may impact", "might affect", "remains to be seen", "it is worth noting." State facts and draw direct conclusions.
2. NAME SPECIFIC COMPANIES AND TICKERS. Do not say "defense contractors" — say "Lockheed Martin ($LMT), RTX Corp ($RTX), Northrop Grumman ($NOC)." Do not say "tech companies" — name the actual companies affected.
3. CITE HISTORICAL PRECEDENT. When a similar bill or action happened before, state the year, what happened, and what the market did. Example: "When the CHIPS Act passed in July 2022, $INTC surged 8% in a week and $TSM gained 4%."
4. BE SPECIFIC ABOUT DOLLAR AMOUNTS. If the bill appropriates money, state the amount. If a sector's TAM changes, estimate by how much.
5. EXPLAIN THE MONEY TRAIL. Where does funding go? Which companies are positioned to receive contracts? What is the mechanism (grants, tax credits, direct procurement)?
6. NON-PARTISAN. No political commentary. Focus only on money, markets, and corporate impact.
7. If enrichment data includes sponsors, use that to assess legislative momentum (committee chairs sponsoring = high momentum; junior members = lower).

Provide analysis in the following JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "impact_score": <1-10 integer>,
  "affected_sectors": ["sector1", "sector2"],
  "tickers": ["$TICK1", "$TICK2"],
  "summary": "<2-3 sentence direct market summary. No hedging.>",
  "full_analysis": "<3-5 paragraphs: 1) What is happening and why it matters RIGHT NOW. 2) The money trail — where funding flows, which companies are positioned to capture it. 3) Historical precedent — what happened last time similar legislation moved, with dates and price action. 4) Specific winners and losers with ticker symbols. 5) Timeline — what happens next and when.>",
  "key_takeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "market_implications": "<1-2 paragraphs. Direct. Name tickers. State direction.>",
  "impact_factors": "<Why this impact score. Reference: legislative stage, dollar amount, sponsor seniority, sector size, historical precedent.>"
}

Standard sector names: Healthcare, Technology, Energy, Finance, Defense, Agriculture, Manufacturing, Infrastructure, Telecommunications, Transportation, Real Estate, Consumer

Impact scoring: 1-3 = procedural with no near-term market impact. 4-6 = moves a specific sector measurably. 7-8 = significant for multiple sectors or a major single-sector shift. 9-10 = market-wide event (omnibus spending, debt ceiling, major regulation).

Respond with raw JSON only. No markdown, no code blocks.`

const CONTRACT_ANALYSIS_PROMPT = `You are a non-partisan federal contract intelligence analyst writing for retail investors. You analyze USAspending.gov contract awards and connect them to publicly traded companies and their stock performance.

CONTRACT AWARD:
Recipient: {recipient}
Award Amount: ${'{amount}'}
Awarding Agency: {agency}
Sub-Agency: {sub_agency}
Description: {description}
Contract Type: {contract_type}
NAICS Code: {naics}
Period: {start_date} to {end_date}

{bill_context}

ANALYSIS RULES — FOLLOW EXACTLY:
1. NO HEDGING. State direct conclusions about who benefits and by how much.
2. IDENTIFY THE PUBLIC COMPANY. If the recipient is a subsidiary, name the parent company and ticker. If the recipient is private, name publicly traded competitors or supply chain partners that benefit.
3. REVENUE IMPACT. Calculate what this contract means as a percentage of the company's annual revenue. A $500M contract to a company with $60B revenue is ~0.8% — meaningful but not transformative. A $500M contract to a $5B company is 10% — a major catalyst.
4. CONNECT TO LEGISLATION. If related bill signals exist, explicitly connect: "This $2.1B award to Raytheon follows directly from the FY2026 NDAA's $886B defense topline, which passed in December."
5. HISTORICAL PATTERN. Reference past contract award → stock price patterns for this company or sector.
6. SUPPLY CHAIN. Name 2-3 subcontractors or suppliers that benefit downstream. These are often smaller-cap companies with outsized price moves.
7. NAME SPECIFIC TICKERS throughout the analysis.

Provide analysis in the following JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "impact_score": <1-10 integer>,
  "affected_sectors": ["sector1", "sector2"],
  "tickers": ["$TICK1", "$TICK2"],
  "summary": "<2-3 sentence direct summary connecting the contract to market impact.>",
  "full_analysis": "<3-5 paragraphs: 1) The contract — who got it, how much, for what. 2) The parent company or publicly traded beneficiary and revenue impact. 3) Connection to legislation — which bill authorized this spending. 4) Supply chain winners — subcontractors and suppliers with tickers. 5) Historical pattern — what happened after similar awards.>",
  "key_takeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "market_implications": "<1-2 paragraphs. Direct. Name tickers. Quantify where possible.>",
  "impact_factors": "<Why this score. Reference: contract size relative to company revenue, sector momentum, legislative backing, supply chain breadth.>",
  "related_bill_numbers": ["HR1234", "S567"] or [] if none identified. Use official bill number format (HR/S/HJRES/SJRES + number).
}

Impact scoring: 1-3 = routine renewal or small contract. 4-6 = meaningful new business for a public company. 7-8 = large contract shifting competitive dynamics. 9-10 = historic-scale award reshaping a sector.

Respond with raw JSON only. No markdown, no code blocks.`

function getApiKey(): string | null {
  return process.env.ABACUSAI_API_KEY ?? null
}

async function callRouteLLM(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a Congressional market intelligence analyst. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response?.ok) {
    const errText = await response?.text?.() ?? ''
    throw new Error(`RouteLLM API ${response?.status}: ${errText?.slice?.(0, 200)}`)
  }
  const data = await response?.json?.()
  return data?.choices?.[0]?.message?.content ?? ''
}

/**
 * Parse raw JSON from LLM response, handling both clean JSON and markdown-wrapped JSON.
 */
function parseJsonResponse(content: string): any | null {
  try {
    return JSON.parse(content ?? '{}')
  } catch {
    const jsonMatch = content?.match?.(/\{[\s\S]*\}/)
    if (jsonMatch?.[0]) {
      try { return JSON.parse(jsonMatch[0]) } catch { /* fall through */ }
    }
    console.error('[ai] Failed to parse response:', content?.slice?.(0, 200))
    return null
  }
}

export async function analyzeCongressItem(item: RawCongressItem): Promise<Partial<Signal> | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error('[ai] No ABACUSAI_API_KEY found.')
    return null
  }

  // Build enrichment block — only included if enrichment data exists
  const enrichmentBlock = item?.enrichment
    ? `\nENRICHMENT DATA (from Congress.gov bill detail):\n${item.enrichment}`
    : ''

  const prompt = ANALYSIS_PROMPT
    ?.replace?.('{type}', item?.type ?? 'unknown')
    ?.replace?.('{title}', item?.title ?? 'Unknown')
    ?.replace?.('{description}', item?.description ?? 'No description')
    ?.replace?.('{date}', item?.date ?? 'Unknown')
    ?.replace?.('{bill_number}', item?.bill_number ?? 'N/A')
    ?.replace?.('{committee}', item?.committee ?? 'N/A')
    ?.replace?.('{legislators}', item?.legislators?.join?.(', ') ?? 'N/A')
    ?.replace?.('{enrichment_block}', enrichmentBlock)

  try {
    console.log(`[ai] Analyzing: ${item?.title?.slice?.(0, 60)}${item?.enrichment ? ' [enriched]' : ''}`)
    const content = await callRouteLLM(prompt, apiKey)

    if (!content) {
      console.error('[ai] Empty response from RouteLLM')
      return null
    }

    const analysis = parseJsonResponse(content)
    if (!analysis) return null

    console.log(`[ai] Success: ${item?.title?.slice?.(0, 40)}`)
    return {
      event_type: 'bill' as const,
      title: item?.title ?? 'Unknown',
      summary: analysis?.summary ?? 'Analysis unavailable',
      full_analysis: analysis?.full_analysis ?? null,
      impact_score: Math.min(10, Math.max(1, parseInt(analysis?.impact_score) || 5)),
      sentiment: (['bullish', 'bearish', 'neutral']?.includes?.(analysis?.sentiment) ? analysis?.sentiment : 'neutral') as 'bullish' | 'bearish' | 'neutral',
      affected_sectors: analysis?.affected_sectors ?? [],
      tickers: analysis?.tickers ?? [],
      source_url: item?.source_url ?? null,
      congress_gov_id: item?.congress_gov_id ?? null,
      bill_number: item?.bill_number ?? null,
      committee: item?.committee ?? null,
      legislators: item?.legislators ?? [],
      event_date: item?.date ?? new Date().toISOString(),
      key_takeaways: analysis?.key_takeaways ?? [],
      market_implications: analysis?.market_implications ?? null,
    }
  } catch (err: any) {
    console.error(`[ai] Analysis failed:`, err?.message)
    return null
  }
}

/**
 * Analyze a USAspending contract award with optional bill context.
 */
export async function analyzeContractItem(
  item: RawContractItem,
  relatedBillSignals: Array<Partial<Signal>>
): Promise<Partial<Signal> | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error('[ai] No ABACUSAI_API_KEY found.')
    return null
  }

  // Build bill context from related signals
  let billContext = 'No directly related bill signals found in database.'
  if (relatedBillSignals.length > 0) {
    const lines = relatedBillSignals.map(s =>
      `- ${s.bill_number ?? 'N/A'}: "${s.title}" (${s.sentiment}, impact ${s.impact_score}/10, sectors: ${(s.affected_sectors ?? []).join(', ')})`
    ).join('\n')
    billContext = `RELATED BILL SIGNALS (from HillSignal database — use these to connect legislation to this contract):\n${lines}`
  }

  const amountStr = formatDollarAmount(item.award_amount)

  const prompt = CONTRACT_ANALYSIS_PROMPT
    .replace('{recipient}', item.recipient_name ?? 'Unknown')
    .replace('{amount}', amountStr)
    .replace('{agency}', item.awarding_agency ?? 'N/A')
    .replace('{sub_agency}', item.awarding_sub_agency ?? 'N/A')
    .replace('{description}', item.description ?? 'No description')
    .replace('{contract_type}', item.contract_type ?? 'N/A')
    .replace('{naics}', item.naics_code ?? 'N/A')
    .replace('{start_date}', item.start_date ?? 'N/A')
    .replace('{end_date}', item.end_date ?? 'N/A')
    .replace('{bill_context}', billContext)

  try {
    console.log(`[ai] Analyzing contract: ${item.recipient_name} — ${amountStr}`)
    const content = await callRouteLLM(prompt, apiKey)
    if (!content) return null

    const analysis = parseJsonResponse(content)
    if (!analysis) return null

    return {
      event_type: 'contract_award',
      title: `${item.recipient_name}: ${amountStr} ${item.awarding_agency} Contract`,
      summary: analysis?.summary ?? 'Analysis unavailable',
      full_analysis: analysis?.full_analysis ?? null,
      impact_score: Math.min(10, Math.max(1, parseInt(analysis?.impact_score) || 5)),
      sentiment: (['bullish', 'bearish', 'neutral']?.includes?.(analysis?.sentiment) ? analysis?.sentiment : 'neutral') as 'bullish' | 'bearish' | 'neutral',
      affected_sectors: analysis?.affected_sectors ?? [],
      tickers: analysis?.tickers ?? [],
      source_url: item.source_url,
      congress_gov_id: `contract-${item.generated_internal_id}`,
      bill_number: null,
      committee: null,
      legislators: [],
      event_date: item.start_date ?? new Date().toISOString(),
      key_takeaways: analysis?.key_takeaways ?? [],
      market_implications: analysis?.market_implications ?? null,
      raw_data: {
        recipient_name: item.recipient_name ?? null,
        award_amount: item.award_amount ?? null,
        awarding_agency: item.awarding_agency ?? null,
        awarding_sub_agency: item.awarding_sub_agency ?? null,
        naics_code: item.naics_code ?? null,
        contract_type: item.contract_type ?? null,
        award_id: item.award_id ?? null,
        related_bill_numbers: analysis?.related_bill_numbers ?? [],
      },
    }
  } catch (err: any) {
    console.error(`[ai] Contract analysis failed:`, err?.message)
    return null
  }
}

/**
 * Pre-filter contracts for market relevance (batch filter via AI).
 */
export async function filterContractsForRelevance(items: RawContractItem[]): Promise<RawContractItem[]> {
  const apiKey = getApiKey()
  if (!apiKey || items.length === 0) return items

  const itemList = items.map((item, i) =>
    `${i}: ${item.recipient_name} — $${(item.award_amount / 1_000_000).toFixed(1)}M from ${item.awarding_agency}. "${(item.description ?? '').slice(0, 120)}"`
  ).join('\n')

  const filterPrompt = `You are a federal contract analyst filtering USAspending awards for retail investors. Keep contracts that have ANY connection to publicly traded companies or their sectors — across ALL industries, not just defense.

CONTRACT AWARDS:
${itemList}

INCLUDE if ANY of these apply:
- The recipient IS or is a subsidiary/JV of a publicly traded company — in ANY sector (defense, tech, healthcare, pharma, energy, construction, telecom, consulting, logistics, manufacturing, etc.)
- The contract is in a sector with major public company players and is large enough ($25M+) to signal spending trends — even if the specific recipient is private, the sector signal matters (e.g., a $50M HHS IT contract signals spending relevant to Accenture, Booz Allen, CACI, etc.)
- The awarding agency or contract description clearly relates to an industry where public companies compete (e.g., DOE energy contracts → NextEra, Duke Energy; HHS pharma contracts → Pfizer, Merck; GSA IT contracts → Palantir, SAIC)
- The contract represents a meaningful shift in government spending priorities that affects an entire sector

EXCLUDE only if:
- The recipient is a small private company with zero connection to any public company or investable sector
- The contract is routine facility maintenance, janitorial, or generic office supplies with no sector signal
- You genuinely cannot identify ANY public company, ETF sector, or industry trend this contract touches

Return: {"relevant_indices": [0, 2, 5]}
If nothing qualifies: {"relevant_indices": []}

Raw JSON only.`

  try {
    const content = await callRouteLLM(filterPrompt, apiKey)
    const parsed = JSON.parse(content ?? '{}')
    const indices: number[] = parsed?.relevant_indices ?? []
    if (indices.length === 0) {
      console.log('[ai] Contract filter returned 0 relevant items')
      return []
    }
    return indices.filter(i => i >= 0 && i < items.length).map(i => items[i])
  } catch (err: any) {
    console.error('[ai] Contract filter failed, using all items:', err?.message)
    return items
  }
}

/**
 * Pre-filter: sends all item titles/descriptions to AI in one call
 * and asks which ones have real potential market impact.
 * This saves per-item analysis calls on procedural junk.
 */
export async function filterForMarketRelevance(items: RawCongressItem[]): Promise<RawCongressItem[]> {
  const apiKey = getApiKey()
  if (!apiKey || items.length === 0) return items

  const itemList = items.map((item, i) => 
    `${i}: [${item.type}] ${item.title}${item.bill_number ? ` (${item.bill_number})` : ''} — ${item.description?.slice?.(0, 120) ?? 'No details'}`
  ).join('\n')

  const filterPrompt = `You are a senior Congressional market analyst filtering items for retail investors. Be STRICT — only keep items that could move markets, affect stock prices, or change conditions for a specific industry or publicly traded company.

ITEMS:
${itemList}

EXCLUDE (return empty array if all items fall into these):
- Procedural: "Providing for consideration of...", quorum calls, adjournment motions, cloture votes on motions to proceed, rules committee procedures
- Ceremonial: post office renamings, commemorative resolutions, National [X] Day/Week/Month, honoring individuals, congratulatory resolutions
- Routine reauthorizations with no policy change (e.g., extending existing programs as-is)
- Administrative: appointment of conferees, journal approval, ordering the previous question
- Symbolic: sense-of-Congress resolutions with no binding authority or budget impact

ALSO EXCLUDE items where:
- The title/description is too vague to determine ANY specific topic (e.g., just "Committee Meeting" or "Hearing" with no subject)
- There is no indication of what policy, sector, or issue is being addressed
- You cannot name a single specific sector, industry, or company that would be affected
- The item is a generic scheduling notice with no substantive content

INCLUDE only if the item does at least ONE of these AND you can identify a specific sector or policy area:
- Creates, changes, or removes regulation on an industry (banking, tech, energy, healthcare, defense, etc.)
- Appropriates significant funding (>$100M) or changes government spending priorities
- Affects taxes, tariffs, trade policy, or interest rate-related policy
- Impacts specific companies or sectors (pharma approvals, defense contracts, tech antitrust, etc.)
- Changes labor law, immigration policy, or housing policy in ways that affect corporate costs or consumer spending
- Involves sanctions, export controls, or foreign policy that affects trade
- Committee hearings on a clearly identified market-relevant topic (Fed oversight, bank regulation, Big Tech, etc.)

Return a JSON object: {"relevant_indices": [0, 2, 5]}
If NOTHING qualifies, return: {"relevant_indices": []}

Raw JSON only.`

  try {
    const content = await callRouteLLM(filterPrompt, apiKey)
    const parsed = JSON.parse(content ?? '{}')
    const indices: number[] = parsed?.relevant_indices ?? []
    
    if (indices.length === 0) {
      console.log('[ai] Filter returned 0 relevant items — nothing market-relevant this batch')
      return []
    }

    return indices
      .filter(i => i >= 0 && i < items.length)
      .map(i => items[i])
  } catch (err: any) {
    console.error('[ai] Filter failed, using all items:', err?.message)
    return items
  }
}

export async function analyzeBatch(items: RawCongressItem[], maxConcurrent: number = 3): Promise<Array<Partial<Signal>>> {
  const results: Array<Partial<Signal>> = []
  
  // Process in chunks to avoid rate limits
  for (let i = 0; i < (items?.length ?? 0); i += maxConcurrent) {
    const chunk = items?.slice?.(i, i + maxConcurrent) ?? []
    const chunkResults = await Promise.allSettled(
      chunk?.map?.((item: RawCongressItem) => analyzeCongressItem(item)) ?? []
    )

    for (const result of chunkResults ?? []) {
      if (result?.status === 'fulfilled' && result?.value) {
        results.push(result.value)
      }
    }

    // Small delay between chunks
    if (i + maxConcurrent < (items?.length ?? 0)) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results
}
