export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/send-digest?secret=CRON_SECRET
 * Called by Supabase pg_cron (or manually) to send digest emails.
 * Respects each user's email_frequency + daily_digest preferences.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // Also accept Bearer token (for Vercel cron compatibility)
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
    // Must have daily_digest enabled
    if (!p.daily_digest) return false
    // If daily_digest is on, send daily by default
    // Weekly users only get it on Monday
    if (p.email_frequency === 'weekly') return isMonday
    // All other frequencies (daily, instant, or any) get the daily digest
    return true
  })

  if (eligibleUsers.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users today' })
  }

  // Fetch recent signals — last 24h for daily, last 7 days for weekly
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get signals from the last 7 days (covers both daily and weekly)
  const { data: recentSignals, error: sigError } = await supabase
    .from('signals')
    .select('id, title, summary, impact_score, sentiment, affected_sectors, tickers, event_type, event_date')
    .gte('created_at', sevenDaysAgo)
    .order('impact_score', { ascending: false })
    .limit(100)

  if (sigError) {
    console.error('Failed to fetch signals:', sigError)
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }

  if (!recentSignals || recentSignals.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No recent signals to send' })
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

  if (!resendKey) {
    console.error('RESEND_API_KEY not configured')
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  for (const pref of eligibleUsers) {
    const email = userEmailMap.get(pref.user_id)
    if (!email) continue

    const isWeekly = pref.email_frequency === 'weekly'
    const cutoff = isWeekly ? sevenDaysAgo : oneDayAgo

    // Filter signals for this user's time window + sector preferences
    let userSignals = recentSignals.filter(
      (s: any) => s.created_at >= cutoff || s.event_date >= cutoff
    )

    // If user has sector preferences, filter (but always include high-impact)
    if (pref.sectors && pref.sectors.length > 0) {
      userSignals = userSignals.filter((s: any) => {
        if (s.impact_score >= 8) return true // Always include high-impact
        return s.affected_sectors?.some((sec: string) =>
          pref.sectors.some((ps: string) => sec.toLowerCase().includes(ps.toLowerCase()))
        )
      })
    }

    if (userSignals.length === 0) continue

    // Cap at top 15 signals
    const topSignals = userSignals.slice(0, 15)
    const html = buildDigestEmail(topSignals, isWeekly)
    const subject = isWeekly
      ? `HillSignal Weekly Digest — ${topSignals.length} Signal${topSignals.length > 1 ? 's' : ''}`
      : `HillSignal Daily Digest — ${topSignals.length} Signal${topSignals.length > 1 ? 's' : ''}`

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

function sentimentEmoji(sentiment: string) {
  if (sentiment === 'bullish') return '🟢'
  if (sentiment === 'bearish') return '🔴'
  return '⚪'
}

function impactBadge(score: number) {
  if (score >= 8) return `<span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">HIGH ${score}/10</span>`
  if (score >= 5) return `<span style="background:#f59e0b;color:#000;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">MED ${score}/10</span>`
  return `<span style="background:#6b7280;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">LOW ${score}/10</span>`
}

function buildDigestEmail(signals: any[], isWeekly: boolean): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hillsignal.com'
  const period = isWeekly ? 'This Week' : 'Today'

  const signalRows = signals.map((s: any) => `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #1e293b;">
        <div style="margin-bottom:8px;">
          ${sentimentEmoji(s.sentiment)} ${impactBadge(s.impact_score)}
          <span style="color:#94a3b8;font-size:12px;margin-left:8px;text-transform:uppercase;">${s.event_type?.replace('_', ' ')}</span>
        </div>
        <a href="${appUrl}/signals/${s.id}" style="color:#e2e8f0;font-size:16px;font-weight:600;text-decoration:none;line-height:1.4;">
          ${s.title}
        </a>
        <p style="color:#94a3b8;font-size:14px;margin:8px 0 4px;line-height:1.5;">
          ${s.summary?.slice(0, 200)}${s.summary?.length > 200 ? '...' : ''}
        </p>
        ${s.tickers?.length ? `<div style="margin-top:6px;">${s.tickers.map((t: string) => `<span style="background:#1e3a5f;color:#60a5fa;padding:2px 6px;border-radius:3px;font-size:11px;margin-right:4px;">$${t}</span>`).join('')}</div>` : ''}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;">
    <tr><td align="center" style="padding:20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 24px;text-align:center;border-bottom:1px solid #1e293b;">
            <div style="font-size:28px;font-weight:700;color:#e2e8f0;letter-spacing:-0.5px;">📊 HillSignal</div>
            <div style="color:#60a5fa;font-size:14px;margin-top:8px;font-weight:500;">${isWeekly ? 'Weekly' : 'Daily'} Market Intelligence Digest</div>
          </td>
        </tr>
        <!-- Summary -->
        <tr>
          <td style="padding:20px 24px;">
            <div style="background:#1e293b;border-radius:8px;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:14px;">${period}:</span>
              <span style="color:#e2e8f0;font-size:14px;font-weight:600;"> ${signals.length} signal${signals.length > 1 ? 's' : ''} detected</span>
            </div>
          </td>
        </tr>
        <!-- Signals -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${signalRows}
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:24px;text-align:center;">
            <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              View All Signals →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 24px;border-top:1px solid #1e293b;text-align:center;">
            <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
              You're receiving this because you enabled digest emails in your
              <a href="${appUrl}/settings" style="color:#60a5fa;text-decoration:none;">HillSignal settings</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
