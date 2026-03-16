export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import SignalDetailClient from './SignalDetailClient'

export default async function SignalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: signal, error } = await supabase
    .from('signals')
    .select('*')
    .eq('id', params?.id ?? '')
    .single()

  if (error || !signal) notFound()

  return <SignalDetailClient signal={signal} />
}
