import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

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
  title: 'Lemon Gallery',
  description: 'Gallery preview for Lemon Squeezy',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ProgressProvider>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 md:px-5 md:py-8">
            {children}
          </main>
          <Toaster />
        </ProgressProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
