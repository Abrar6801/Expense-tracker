'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  email?: string
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const supabase = createClient()

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch {
      toast.error('Failed to sign out')
    } finally {
      setIsSigningOut(false)
    }
  }

  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium truncate text-foreground">{email ?? 'Account'}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
