export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

/**
 * Dashboard page - protected route
 * Fetches real aggregate stats from the database, then renders DashboardClient.
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

  // Fetch aggregate stats using admin client (head: true = count only, no rows)
  const adminClient = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, analyzedRes, weekRes] = await Promise.all([
    adminClient.from('signals').select('id', { count: 'exact', head: true }),
    adminClient.from('signals').select('id', { count: 'exact', head: true }).not('full_analysis', 'is', null),
    adminClient.from('signals').select('id', { count: 'exact', head: true }).gte('event_date', sevenDaysAgo),
  ])

  const stats = {
    totalSignals: totalRes.count ?? 0,
    analyzedSignals: analyzedRes.count ?? 0,
    thisWeekSignals: weekRes.count ?? 0,
  }

  return <DashboardClient userEmail={user?.email ?? ''} preferences={preferences} stats={stats} />
}
