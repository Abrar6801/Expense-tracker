import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { EnvelopesClient } from '@/components/envelopes/envelopes-client'

export const metadata: Metadata = { title: 'Cash Envelopes' }

export default async function EnvelopesPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return <EnvelopesClient email={session?.user?.email} />
}
