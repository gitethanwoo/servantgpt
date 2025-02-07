'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import { FeedbackProvider } from './feedback-provider'
import { Toaster } from 'sonner'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FeedbackProvider>
          <Toaster position="top-center" />
          {children}
        </FeedbackProvider>
      </ThemeProvider>
    </SessionProvider>
  )
} 