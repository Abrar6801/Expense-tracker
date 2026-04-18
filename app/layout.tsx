import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Expense Tracker',
    template: '%s — Expense Tracker',
  },
  description: 'Track your income, expenses, and net worth in one place.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: 'bg-card border-border text-foreground',
                description: 'text-muted-foreground',
                actionButton: 'bg-primary text-primary-foreground',
                cancelButton: 'bg-muted text-muted-foreground',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
