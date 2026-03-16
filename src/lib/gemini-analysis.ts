/**
 * Gemini AI Analysis Engine
 * Supports both direct Google Gemini API (GEMINI_API_KEY) 
 * and Abacus AI RouteLLM proxy (ABACUSAI_API_KEY)
 */

import type { Signal } from '@/lib/types'
import type { RawCongressItem } from '@/lib/congress-api'

const ANALYSIS_PROMPT = `You are a non-partisan Congressional market intelligence analyst for retail investors.
Analyze this Congressional event and provide market-relevant analysis.

CONGRESSIONAL EVENT:
Type: {type}
Title: {title}
Details: {description}
Date: {date}
Bill Number: {bill_number}
Committee: {committee}
Legislators: {legislators}

Provide analysis in the following JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "impact_score": <1-10 integer>,
  "affected_sectors": ["sector1", "sector2"],
  "tickers": ["$TICK1", "$TICK2"],
  "summary": "<2-3 sentence market-focused summary>",
  "full_analysis": "<Detailed 3-5 paragraph analysis covering: 1) What happened 2) Market implications 3) Which sectors/companies are affected and why 4) Historical context or precedent 5) Timeline and next steps>",
  "key_takeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "market_implications": "<1-2 paragraph focused market outlook>",
  "impact_factors": "<Brief explanation of why this impact score was given, considering: legislative momentum, market size affected, timeline proximity, historical precedent>"
}

Rules:
- Be strictly factual and non-partisan
- Focus on market and investment implications only
- Use standard sector names: Healthcare, Technology, Energy, Finance, Defense, Agriculture, Manufacturing, Infrastructure, Telecommunications, Transportation, Real Estate, Consumer
- Include specific ticker symbols when companies are clearly affected
- Impact score criteria: 1-3 minimal market impact, 4-6 moderate sector impact, 7-8 significant market mover, 9-10 major market event
- Do NOT include political opinions or partisan commentary

Respond with raw JSON only. No markdown, no code blocks.`

function getApiConfigs(): Array<{ type: 'google' | 'routellm'; key: string }> {
  const configs: Array<{ type: 'google' | 'routellm'; key: string }> = []
  // RouteLLM first — free and reliable
  const abacusKey = process.env.ABACUSAI_API_KEY
  if (abacusKey) configs.push({ type: 'routellm', key: abacusKey })
  // Google Gemini as fallback
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) configs.push({ type: 'google', key: geminiKey })
  return configs
}

async function callGeminiDirect(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: 'You are a Congressional market intelligence analyst. Output only valid JSON.' }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  )
  if (!response?.ok) {
    const errText = await response?.text?.() ?? ''
    throw new Error(`Google Gemini API ${response?.status}: ${errText?.slice?.(0, 200)}`)
  }
  const data = await response?.json?.()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
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

export async function analyzeCongressItem(item: RawCongressItem): Promise<Partial<Signal> | null> {
  const configs = getApiConfigs()
  if (configs.length === 0) {
    console.error('[gemini] No API key found. Set ABACUSAI_API_KEY or GEMINI_API_KEY.')
    return null
  }

  const prompt = ANALYSIS_PROMPT
    ?.replace?.('{type}', item?.type ?? 'unknown')
    ?.replace?.('{title}', item?.title ?? 'Unknown')
    ?.replace?.('{description}', item?.description ?? 'No description')
    ?.replace?.('{date}', item?.date ?? 'Unknown')
    ?.replace?.('{bill_number}', item?.bill_number ?? 'N/A')
    ?.replace?.('{committee}', item?.committee ?? 'N/A')
    ?.replace?.('{legislators}', item?.legislators?.join?.(', ') ?? 'N/A')

  // Try each API config in order, with fallback
  for (const config of configs) {
    try {
      console.log(`[gemini] Trying ${config.type} API for: ${item?.title?.slice?.(0, 60)}`)
      const content = config.type === 'google'
        ? await callGeminiDirect(prompt, config.key)
        : await callRouteLLM(prompt, config.key)

      if (!content) {
        console.error(`[gemini] Empty response from ${config.type}`)
        continue
      }

      let analysis: any
      try {
        analysis = JSON.parse(content ?? '{}')
      } catch {
        const jsonMatch = content?.match?.(/\{[\s\S]*\}/)
        if (jsonMatch?.[0]) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          console.error('[gemini] Failed to parse response:', content?.slice?.(0, 200))
          continue
        }
      }

      console.log(`[gemini] Success via ${config.type} for: ${item?.title?.slice?.(0, 40)}`)
      return {
        event_type: item?.type === 'meeting' ? 'hearing' : (item?.type as any) ?? 'bill',
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
      console.error(`[gemini] ${config.type} failed:`, err?.message)
      // Continue to next config
    }
  }

  console.error(`[gemini] All API configs failed for: ${item?.title?.slice?.(0, 60)}`)
  return null
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
