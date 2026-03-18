export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/send-digest?secret=CRON_SECRET
 * Bloomberg-style digest: 5 daily / 10 weekly, tickers + $ front and center.
 * Uses created_at (when HillSignal ingested) for time window — not event_date.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const validSecret = process.env.CRON_SECRET
  if (validSecret && secret !== validSecret && bearerToken !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return sendDigest()
}

async function sendDigest() {
  const supabase = createAdminClient()
  const now = new Date()
  const isMonday = now.getUTCDay() === 1

  // Fetch all users with their preferences
  const { data: allPrefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('user_id, sectors, email_frequency, daily_digest')

  if (prefsError) {
    console.error('Failed to fetch preferences:', prefsError)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }

  if (!allPrefs || allPrefs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users with preferences' })
  }

  // Filter users who should receive a digest right now
  const eligibleUsers = allPrefs.filter((p: any) => {
    if (!p.daily_digest) return false
    if (p.email_frequency === 'weekly') return isMonday
    return true
  })

  if (eligibleUsers.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users today' })
  }

  // Fetch recent ANALYZED signals using created_at (when HillSignal ingested).
  // This ensures newly polled contracts/bills always appear even if their
  // event_date (award date, introduction date) is older.
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const { data: recentSignals, error: sigError } = await supabase
    .from('signals')
    .select('id, title, summary, impact_score, sentiment, affected_sectors, tickers, event_type, event_date, created_at, full_analysis, raw_data')
    .gte('created_at', sevenDaysAgo)              // Ingested in last 7 days
    .not('full_analysis', 'is', null)             // Must have AI analysis
    .gt('impact_score', 3)                        // Must have real impact
    .order('impact_score', { ascending: false })
    .limit(50)

  if (sigError) {
    console.error('Failed to fetch signals:', sigError)
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }

  if (!recentSignals || recentSignals.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No analyzed signals to send' })
  }

  // Get user emails
  const userIds = eligibleUsers.map((u: any) => u.user_id)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('id', userIds)

  if (usersError || !users) {
    console.error('Failed to fetch users:', usersError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const userEmailMap = new Map(users.map((u: any) => [u.id, u.email]))

  // Send emails
  let sent = 0
  let errors = 0
  const resendKey = process.env.RESEND_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hillsignal.com'

  if (!resendKey) {
    console.error('RESEND_API_KEY not configured')
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  for (const pref of eligibleUsers) {
    const email = userEmailMap.get(pref.user_id)
    if (!email) continue

    const isWeekly = pref.email_frequency === 'weekly'
    const cutoff = isWeekly ? sevenDaysAgo : oneDayAgo
    const maxSignals = isWeekly ? 10 : 5

    // Filter signals for this user's time window using created_at
    let userSignals = recentSignals.filter(
      (s: any) => s.created_at >= cutoff
    )

    // If user has sector preferences, filter (but always include high-impact)
    if (pref.sectors && pref.sectors.length > 0) {
      userSignals = userSignals.filter((s: any) => {
        if (s.impact_score >= 8) return true
        return s.affected_sectors?.some((sec: string) =>
          pref.sectors.some((ps: string) => sec.toLowerCase().includes(ps.toLowerCase()))
        )
      })
    }

    if (userSignals.length === 0) continue

    const topSignals = userSignals.slice(0, maxSignals)

    // Build the subject line — Bloomberg style with top ticker/amount
    const subject = buildSubjectLine(topSignals, isWeekly)
    const html = buildDigestEmail(topSignals, isWeekly, userSignals.length)

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'HillSignal <onboarding@resend.dev>',
          to: [email],
          subject,
          html,
          headers: {
            'List-Unsubscribe': `<${appUrl}/profile>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })

      if (res.ok) {
        sent++
      } else {
        const errBody = await res.text()
        console.error(`Failed to send to ${email}:`, errBody)
        errors++
      }
    } catch (err) {
      console.error(`Error sending to ${email}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    sent,
    errors,
    eligible: eligibleUsers.length,
    signals: recentSignals.length,
  })
}

/* ───────────────────────────────────────────────────
 *  FORMATTING HELPERS
 * ─────────────────────────────────────────────────── */

function formatDollarAmount(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) {
    const b = abs / 1_000_000_000
    return `$${b >= 100 ? b.toFixed(0) : b.toFixed(1)}B`
  }
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    return `$${m >= 100 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`
  return `$${abs.toFixed(0)}`
}

/** Fix malformed dollar amounts in titles like "$10410.5M" → "$10.4B" */
function fixDollars(text: string): string {
  return text.replace(/\$[\d,]+(?:\.\d+)?[MBK]/g, (match) => {
    const suffix = match.slice(-1)
    const num = parseFloat(match.slice(1, -1).replace(/,/g, ''))
    if (isNaN(num)) return match
    const mult: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }
    return formatDollarAmount(num * (mult[suffix] ?? 1))
  })
}

/** Extract contract dollar amount from raw_data or title */
function getContractAmount(signal: any): string | null {
  const rawAmount = signal.raw_data?.award_amount
  if (rawAmount && typeof rawAmount === 'number' && rawAmount > 0) {
    return formatDollarAmount(rawAmount)
  }
  // Fallback: parse from title
  const match = signal.title?.match(/\$[\d,.]+[MBK]?/i)
  return match ? fixDollars(match[0]) : null
}

/** Build Bloomberg-style subject line */
function buildSubjectLine(signals: any[], isWeekly: boolean): string {
  const period = isWeekly ? 'Weekly' : 'Daily'

  // Find the most impactful signal for the headline
  const top = signals[0]
  if (!top) return `HillSignal ${period} Brief`

  // Collect all unique tickers
  const allTickers = [...new Set(signals.flatMap((s: any) => s.tickers ?? []))]
  const tickerStr = allTickers.slice(0, 3).map(t => `$${t}`).join(' ')

  if (top.event_type === 'contract_award') {
    const amount = getContractAmount(top)
    const recipient = top.raw_data?.recipient_name?.split(' ').slice(0, 2).join(' ') ?? ''
    if (amount && recipient) {
      return `${recipient} wins ${amount} contract${tickerStr ? ` — ${tickerStr}` : ''}`
    }
  }

  // Bill: use short title + tickers
  const shortTitle = (top.title ?? '').slice(0, 50).replace(/\s+\S*$/, '')
  if (tickerStr) return `${shortTitle}… — ${tickerStr}`
  return `HillSignal ${period} Brief — ${signals.length} Signals`
}

/* ───────────────────────────────────────────────────
 *  EMAIL TEMPLATE — Bloomberg-style brief
 * ─────────────────────────────────────────────────── */

function sentimentDot(sentiment: string): string {
  const colors: Record<string, string> = { bullish: '#22c55e', bearish: '#ef4444', neutral: '#64748b' }
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[sentiment] ?? colors.neutral};margin-right:6px;vertical-align:middle;"></span>`
}

function sentimentWord(sentiment: string): string {
  const styles: Record<string, string> = {
    bullish: 'color:#22c55e;font-weight:700;font-size:11px;letter-spacing:0.5px;',
    bearish: 'color:#ef4444;font-weight:700;font-size:11px;letter-spacing:0.5px;',
    neutral: 'color:#64748b;font-weight:700;font-size:11px;letter-spacing:0.5px;',
  }
  return `<span style="${styles[sentiment] ?? styles.neutral}">${(sentiment ?? 'neutral').toUpperCase()}</span>`
}

function buildSignalCard(signal: any, index: number, appUrl: string): string {
  const isContract = signal.event_type === 'contract_award'
  const amount = isContract ? getContractAmount(signal) : null
  const recipient = signal.raw_data?.recipient_name ?? null
  const agency = signal.raw_data?.awarding_agency ?? null
  const title = fixDollars(signal.title ?? 'Untitled')
  const tickers = (signal.tickers ?? []) as string[]
  const sectors = (signal.affected_sectors ?? []) as string[]

  // Type label
  const typeLabel = isContract
    ? '<span style="background:#1e3a5f;color:#60a5fa;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:0.5px;">CONTRACT</span>'
    : '<span style="background:#1a2e1a;color:#4ade80;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:0.5px;">BILL</span>'

  // Dollar amount badge (contracts only)
  const amountBadge = amount
    ? `<span style="background:#14532d;color:#4ade80;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:700;font-family:monospace;letter-spacing:-0.3px;">${amount}</span>`
    : ''

  // Ticker pills
  const tickerPills = tickers.length > 0
    ? tickers.slice(0, 5).map(t =>
      `<span style="background:#1e3a5f;color:#93c5fd;padding:3px 10px;border-radius:3px;font-size:13px;font-weight:700;font-family:monospace;margin-right:5px;">$${t}</span>`
    ).join('')
    : ''

  // Summary — keep it tight
  const summary = (signal.summary ?? '').slice(0, 160) + ((signal.summary?.length ?? 0) > 160 ? '…' : '')

  // Contract-specific subtitle
  const contractMeta = isContract && recipient
    ? `<div style="color:#cbd5e1;font-size:12px;margin-top:4px;">${recipient}${agency ? ` · ${agency}` : ''}</div>`
    : ''

  // Sector tag
  const sectorTag = sectors.length > 0
    ? `<span style="color:#94a3b8;font-size:11px;margin-left:8px;">${sectors[0]}</span>`
    : ''

  return `
    <tr>
      <td style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:8px;margin-bottom:12px;border-left:3px solid ${signal.sentiment === 'bullish' ? '#22c55e' : signal.sentiment === 'bearish' ? '#ef4444' : '#475569'};">
          <tr>
            <td style="padding:16px 18px;">
              <!-- Row 1: Type + Sentiment + Amount -->
              <div style="margin-bottom:8px;">
                ${typeLabel}
                <span style="margin-left:8px;">${sentimentDot(signal.sentiment)}${sentimentWord(signal.sentiment)}</span>
                ${amountBadge ? `<span style="float:right;">${amountBadge}</span>` : ''}
              </div>
              <!-- Row 2: Title -->
              <a href="${appUrl}/signals/${signal.id}" style="color:#f1f5f9;font-size:15px;font-weight:600;text-decoration:none;line-height:1.35;display:block;">
                ${title}
              </a>
              ${contractMeta}
              <!-- Row 3: Summary -->
              <p style="color:#cbd5e1;font-size:13px;margin:8px 0 0;line-height:1.5;">
                ${summary}
              </p>
              <!-- Row 4: Tickers + Sector -->
              ${tickerPills || sectorTag ? `<div style="margin-top:10px;">${tickerPills}${sectorTag}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function buildDigestEmail(signals: any[], isWeekly: boolean, totalAvailable: number): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hillsignal.com'
  const period = isWeekly ? 'This Week' : 'Today'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // Stats
  const bullishCount = signals.filter(s => s.sentiment === 'bullish').length
  const bearishCount = signals.filter(s => s.sentiment === 'bearish').length
  const contractCount = signals.filter(s => s.event_type === 'contract_award').length
  const billCount = signals.filter(s => s.event_type === 'bill').length
  const allTickers = [...new Set(signals.flatMap((s: any) => s.tickers ?? []))]

  // Build signal cards
  const signalCards = signals.map((s, i) => buildSignalCard(s, i, appUrl)).join('')

  // Top tickers strip
  const tickerStrip = allTickers.length > 0
    ? allTickers.slice(0, 8).map(t =>
      `<span style="color:#93c5fd;font-size:14px;font-weight:700;font-family:monospace;margin-right:14px;">$${t}</span>`
    ).join('')
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030712;">
    <tr><td align="center" style="padding:16px;">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="padding:24px 24px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:800;color:#f8fafc;letter-spacing:-0.5px;">HILLSIGNAL</span>
                  <span style="color:#64748b;font-size:22px;font-weight:300;margin-left:4px;">|</span>
                  <span style="color:#cbd5e1;font-size:13px;font-weight:500;margin-left:8px;vertical-align:middle;">${isWeekly ? 'WEEKLY' : 'DAILY'} BRIEF</span>
                </td>
                <td style="text-align:right;">
                  <span style="color:#94a3b8;font-size:11px;">${dateStr}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="padding:0 24px;"><div style="border-top:2px solid #1e293b;"></div></td></tr>

        <!-- MARKET PULSE STRIP -->
        <tr>
          <td style="padding:16px 24px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#0f172a;border-radius:8px;padding:14px 18px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#cbd5e1;font-size:11px;font-weight:600;letter-spacing:1px;padding-bottom:8px;" colspan="4">MARKET PULSE</td>
                    </tr>
                    <tr>
                      <td style="width:25%;">
                        <div style="color:#94a3b8;font-size:10px;letter-spacing:0.5px;">SIGNALS</div>
                        <div style="color:#f1f5f9;font-size:18px;font-weight:700;">${signals.length}</div>
                      </td>
                      <td style="width:25%;">
                        <div style="color:#94a3b8;font-size:10px;letter-spacing:0.5px;">BULLISH</div>
                        <div style="color:#22c55e;font-size:18px;font-weight:700;">${bullishCount}</div>
                      </td>
                      <td style="width:25%;">
                        <div style="color:#94a3b8;font-size:10px;letter-spacing:0.5px;">BEARISH</div>
                        <div style="color:#ef4444;font-size:18px;font-weight:700;">${bearishCount}</div>
                      </td>
                      <td style="width:25%;">
                        <div style="color:#94a3b8;font-size:10px;letter-spacing:0.5px;">CONTRACTS</div>
                        <div style="color:#60a5fa;font-size:18px;font-weight:700;">${contractCount}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TICKERS STRIP -->
        ${tickerStrip ? `
        <tr>
          <td style="padding:4px 24px 12px;">
            <div style="background:#0f172a;border-radius:6px;padding:10px 18px;overflow:hidden;">
              <span style="color:#94a3b8;font-size:10px;font-weight:600;letter-spacing:1px;margin-right:12px;">TICKERS IN PLAY</span>
              ${tickerStrip}
            </div>
          </td>
        </tr>` : ''}

        <!-- SECTION LABEL -->
        <tr>
          <td style="padding:16px 24px 8px;">
            <span style="color:#cbd5e1;font-size:11px;font-weight:700;letter-spacing:1.5px;">TOP SIGNALS — ${period.toUpperCase()}</span>
          </td>
        </tr>

        <!-- SIGNAL CARDS -->
        ${signalCards}

        <!-- MORE SIGNALS NOTE -->
        ${totalAvailable > signals.length ? `
        <tr>
          <td style="padding:4px 24px 12px;">
            <div style="color:#94a3b8;font-size:12px;text-align:center;">
              + ${totalAvailable - signals.length} more signals on your dashboard
            </div>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:16px 24px 24px;text-align:center;">
            <a href="${appUrl}/dashboard" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:12px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.3px;">
              VIEW FULL DASHBOARD →
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:0 24px;"><div style="border-top:1px solid #1e293b;"></div></td>
        </tr>
        <tr>
          <td style="padding:16px 24px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
              Congressional intelligence for investors
            </p>
            <p style="color:#94a3b8;font-size:11px;margin:8px 0 0;line-height:1.6;">
              <a href="${appUrl}/settings" style="color:#94a3b8;text-decoration:underline;">Manage preferences</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${appUrl}/settings" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
            </p>
            <p style="color:#64748b;font-size:10px;margin:8px 0 0;">
              Not financial advice. Past legislative activity is not indicative of future market performance.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
