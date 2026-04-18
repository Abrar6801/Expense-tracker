import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PlannerClient } from '@/components/planner/planner-client'

export const metadata: Metadata = { title: 'Budget Planner' }

export default async function PlannerPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return <PlannerClient email={session?.user?.email} />
}
