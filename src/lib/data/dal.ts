import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  full_name: string
  role: 'super_admin' | 'member'
  room_label: string | null
  is_active: boolean
}

/**
 * Verifies the caller has an active Supabase session and loads their profile
 * (including role). Redirects to /login if not authenticated. Memoized per
 * request so calling this from multiple Server Components/Actions is cheap.
 */
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, room_label, is_active')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/login')
  }

  return profile
})

/** Same as getCurrentProfile but also enforces super_admin role. */
export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (profile.role !== 'super_admin') {
    redirect('/dashboard')
  }
  return profile
}
