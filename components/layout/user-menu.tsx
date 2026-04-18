'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronUp, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface UserMenuProps {
  email?: string
  compact?: boolean
}

export function UserMenu({ email, compact }: UserMenuProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      const name = meta?.full_name ?? meta?.name ?? ''
      setDisplayName(name)
      setNameInput(name)
    })
  }, [])

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

  async function handleSaveName() {
    if (!nameInput.trim()) return
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nameInput.trim() },
      })
      if (error) { toast.error(error.message); return }
      setDisplayName(nameInput.trim())
      toast.success('Name updated!')
      setShowNameDialog(false)
      router.refresh()
    } catch {
      toast.error('Failed to update name')
    } finally {
      setIsSaving(false)
    }
  }

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email?.slice(0, 2).toUpperCase() ?? 'U'

  const avatar = (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 text-xs font-bold text-violet-300">
      {initials}
    </div>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <button
              title="Account"
              className="flex items-center justify-center rounded-xl p-1.5 hover:bg-white/[0.04] transition-colors"
            >
              {avatar}
            </button>
          ) : (
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/[0.04] transition-colors group">
              {avatar}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium truncate text-white/80">
                  {displayName || email?.split('@')[0] || 'Account'}
                </p>
                <p className="text-[10px] text-white/30 truncate">{email}</p>
              </div>
              <ChevronUp className="h-3.5 w-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={compact ? 'start' : 'end'} side={compact ? 'right' : 'top'} className="w-56 glass border-white/[0.08]">
          <div className="px-3 py-2.5">
            <p className="text-xs font-medium text-white/80 truncate">
              {displayName || email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5 truncate">{email}</p>
          </div>
          <DropdownMenuSeparator className="bg-white/[0.06]" />
          <DropdownMenuItem
            onClick={() => { setNameInput(displayName); setShowNameDialog(true) }}
            className="focus:bg-white/5 cursor-pointer mx-1 rounded-lg"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Set display name
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/[0.06]" />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer mx-1 rounded-lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-sm glass border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>Set display name</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs text-white/50 uppercase tracking-wider">Your name</Label>
            <Input
              placeholder="e.g. Alex"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              className="bg-white/[0.04] border-white/[0.08] focus:border-violet-500/50 text-white placeholder:text-white/20 h-11"
              autoFocus
            />
            <p className="text-[11px] text-white/30">This name will be used in your dashboard greeting.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)} disabled={isSaving} className="border-white/10 hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleSaveName}
              disabled={isSaving || !nameInput.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
