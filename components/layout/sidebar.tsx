'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LayoutDashboard, CreditCard, ArrowLeftRight, CalendarClock, Target, Wallet, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/layout/user-menu'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/planner', label: 'Planner', icon: CalendarClock },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/envelopes', label: 'Envelopes', icon: Wallet },
  { href: '/splits', label: 'Splits', icon: Users },
]

interface SidebarProps {
  email?: string
}

export function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-16 lg:w-64 shrink-0 h-screen sticky top-0 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3.5 lg:px-5 py-6 overflow-hidden">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
          <Sparkles className="text-white" style={{ height: '1.1rem', width: '1.1rem' }} />
          <div className="absolute inset-0 rounded-xl bg-white/10" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <span className="font-bold text-sm tracking-tight text-white">Aurora</span>
          <span className="block text-[10px] text-white/40 leading-none mt-0.5 tracking-widest uppercase">Finance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
        <p className="hidden lg:block px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'group flex items-center justify-center lg:justify-start gap-3 rounded-xl py-2.5 px-0 lg:px-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-300 shadow-sm'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              )}
            >
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all',
                isActive
                  ? 'bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-300'
                  : 'text-white/30 group-hover:text-white/60'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="hidden lg:block">{label}</span>
              {isActive && (
                <div className="ml-auto hidden lg:block h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="border-t border-white/[0.06]">
        <div className="md:flex lg:hidden justify-center p-3">
          <UserMenu email={email} compact />
        </div>
        <div className="hidden lg:block p-3">
          <UserMenu email={email} />
        </div>
      </div>
    </aside>
  )
}
