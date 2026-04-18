'use client'

import { Sparkles } from 'lucide-react'
import { UserMenu } from '@/components/layout/user-menu'

interface HeaderProps {
  title: string
  email?: string
  action?: React.ReactNode
}

export function Header({ title, email, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 shrink-0">
            <Sparkles className="text-white" style={{ height: '0.9rem', width: '0.9rem' }} />
          </div>
          <h1 className="text-sm font-semibold text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <UserMenu email={email} compact />
        </div>
      </div>
    </header>
  )
}
