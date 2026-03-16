import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const metadata = {
  title: 'Profile — HillSignal',
  description: 'Manage your HillSignal account and subscription.',
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const admin = createAdminClient()

  // Fetch user record
  const { data: userData } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch purchase info
  const { data: purchase } = await admin
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch preferences
  const { data: preferences } = await admin
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <ProfileClient
      email={user.email || ''}
      createdAt={user.created_at || ''}
      userData={userData}
      purchase={purchase}
      preferences={preferences}
    />
  )
}
