export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  let preferences = null
  try {
    const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user?.id).single()
    preferences = data
  } catch {}

  return <SettingsClient userEmail={user?.email ?? ''} preferences={preferences} />
}
