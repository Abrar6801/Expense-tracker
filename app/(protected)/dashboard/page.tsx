import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const meta = session?.user?.user_metadata
  const displayName = meta?.full_name ?? meta?.name ?? undefined

  return <DashboardClient email={session?.user?.email} displayName={displayName} />
}
