export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('id', id ?? '')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
    }

    return NextResponse.json({ signal: data })
  } catch (error: any) {
    console.error('Signal detail error:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch signal' }, { status: 500 })
  }
}
