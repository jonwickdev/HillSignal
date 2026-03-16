export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/signals/actions
 * Returns user's favorites and dismissed signal IDs
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_signal_actions')
      .select('signal_id, action')
      .eq('user_id', user.id)

    if (error) {
      console.error('[actions] Read error:', error.message)
      return NextResponse.json({ favorites: [], dismissed: [] })
    }

    const favorites = (data ?? []).filter((a: any) => a.action === 'favorite').map((a: any) => a.signal_id)
    const dismissed = (data ?? []).filter((a: any) => a.action === 'dismissed').map((a: any) => a.signal_id)

    return NextResponse.json({ favorites, dismissed })
  } catch (err: any) {
    console.error('[actions] Error:', err?.message)
    return NextResponse.json({ favorites: [], dismissed: [] })
  }
}

/**
 * POST /api/signals/actions
 * Toggle a favorite or dismiss a signal
 * Body: { signal_id: string, action: 'favorite' | 'dismissed' }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { signal_id, action } = body ?? {}

    if (!signal_id || !['favorite', 'dismissed'].includes(action)) {
      return NextResponse.json({ error: 'Invalid signal_id or action' }, { status: 400 })
    }

    // Check if action already exists (toggle off)
    const { data: existing } = await supabase
      .from('user_signal_actions')
      .select('id')
      .eq('user_id', user.id)
      .eq('signal_id', signal_id)
      .eq('action', action)
      .maybeSingle()

    if (existing) {
      // Remove it (toggle off)
      await supabase.from('user_signal_actions').delete().eq('id', existing.id)
      return NextResponse.json({ status: 'removed', action })
    } else {
      // Add it
      const { error: insertErr } = await supabase.from('user_signal_actions').insert({
        user_id: user.id,
        signal_id,
        action,
      })
      if (insertErr) {
        console.error('[actions] Insert error:', insertErr.message)
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
      return NextResponse.json({ status: 'added', action })
    }
  } catch (err: any) {
    console.error('[actions] Error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
