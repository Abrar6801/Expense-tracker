import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TransactionsClient } from '@/components/transactions/transactions-client'

export const metadata: Metadata = { title: 'Transactions' }

export default async function TransactionsPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <TransactionsClient email={session?.user?.email} />
}
