export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

/**
 * Dashboard page - protected route
 * Shows real Congressional signal feed from Supabase
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  let preferences = null
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    preferences = data
  } catch {
    // Preferences not set yet
  }

  return <DashboardClient userEmail={user?.email ?? ''} preferences={preferences} />
}
