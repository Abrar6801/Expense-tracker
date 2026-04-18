import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <DashboardClient email={session?.user?.email} />
}
