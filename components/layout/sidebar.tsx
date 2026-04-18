'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, LayoutDashboard, CreditCard, ArrowLeftRight, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/layout/user-menu'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/planner', label: 'Planner', icon: CalendarClock },
]

interface SidebarProps {
  email?: string
}

export function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-card/50 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Expense Tracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="p-3 border-t border-border">
        <UserMenu email={email} />
      </div>
    </aside>
  )
}
