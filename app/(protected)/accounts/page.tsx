import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AccountsClient } from '@/components/accounts/accounts-client'

export const metadata: Metadata = { title: 'Accounts' }

export default async function AccountsPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <AccountsClient email={session?.user?.email} />
}
