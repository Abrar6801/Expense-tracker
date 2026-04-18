import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ChatPanel } from '@/components/chat/chat-panel'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const email = session.user.email

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
      <ChatPanel />
    </div>
  )
}
