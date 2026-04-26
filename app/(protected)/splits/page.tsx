import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SplitsClient } from '@/components/splits/splits-client'

export const metadata: Metadata = { title: 'Splits' }

export default async function SplitsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return <SplitsClient email={session?.user?.email} />
}
