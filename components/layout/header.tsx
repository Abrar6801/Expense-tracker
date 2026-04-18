'use client'

import { TrendingUp } from 'lucide-react'
import { UserMenu } from '@/components/layout/user-menu'

interface HeaderProps {
  title: string
  email?: string
  action?: React.ReactNode
}

export function Header({ title, email, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-base font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  )
}
