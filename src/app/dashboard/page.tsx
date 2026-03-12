import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

/**
 * Dashboard page - protected route
 * Shows mock signal feed for demonstration
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch user preferences
  let preferences = null
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    preferences = data
  } catch (e) {
    // Preferences not set yet
  }

  return <DashboardClient user={user} preferences={preferences} />
}
