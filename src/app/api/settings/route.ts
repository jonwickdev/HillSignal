export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user?.id)
      .single()

    if (error) return NextResponse.json({ preferences: null })
    return NextResponse.json({ preferences: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request?.json?.()
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user?.id,
      sectors: body?.sectors ?? [],
      email_frequency: body?.email_frequency ?? 'daily',
      high_impact_alerts: body?.high_impact_alerts ?? true,
      sector_alerts: body?.sector_alerts ?? false,
      daily_digest: body?.daily_digest ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to save settings' }, { status: 500 })
  }
}
