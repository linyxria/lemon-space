import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'

import GalleryProvider from '@/components/gallery-provider'
import PreferencesProvider from '@/components/preferences-provider'
import { Toaster } from '@/components/ui/sonner'
import { TRPCReactProvider } from '@/trpc/client'

import Header from './_components/header'
import ProgressProvider from './_components/progress-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Lemon Space',
  description: 'A personal writing space with a visual gallery.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <ProgressProvider>
                <PreferencesProvider>
                  <GalleryProvider>
                    <Header />
                    <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 md:px-5 md:py-8">
                      {children}
                    </main>
                    <Toaster />
                  </GalleryProvider>
                </PreferencesProvider>
              </ProgressProvider>
            </NextIntlClientProvider>
          </TRPCReactProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
