'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, ArrowLeftRight, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/planner', label: 'Planner', icon: CalendarClock },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/60 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-all duration-200 relative',
                isActive ? 'text-violet-300' : 'text-white/30'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
              )}
              <div className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl transition-all',
                isActive ? 'bg-violet-500/20' : ''
              )}>
                <Icon style={{ height: '1.2rem', width: '1.2rem' }} />
              </div>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
