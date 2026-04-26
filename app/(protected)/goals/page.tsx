import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { GoalsClient } from '@/components/goals/goals-client'

export const metadata: Metadata = { title: 'Savings Goals' }

export default async function GoalsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return <GoalsClient email={session?.user?.email} />
}
