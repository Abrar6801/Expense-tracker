'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const PAGES = ['/dashboard', '/accounts', '/transactions', '/planner']
const SWIPE_THRESHOLD = 60   // min horizontal px to trigger
const VERTICAL_LIMIT = 80    // max vertical px before it's considered a scroll

export function SwipeNavigator() {
  const router = useRouter()
  const pathname = usePathname()
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.innerWidth >= 768) return // sidebar is visible, no swipe needed
      const t = e.touches[0]
      touchStart.current = { x: t.clientX, y: t.clientY }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStart.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = Math.abs(t.clientY - touchStart.current.y)
      touchStart.current = null

      if (dy > VERTICAL_LIMIT || Math.abs(dx) < SWIPE_THRESHOLD) return

      const idx = PAGES.findIndex(p => pathname.startsWith(p))
      if (idx === -1) return

      if (dx < 0 && idx < PAGES.length - 1) router.push(PAGES[idx + 1])
      if (dx > 0 && idx > 0) router.push(PAGES[idx - 1])
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pathname, router])

  return null
}
