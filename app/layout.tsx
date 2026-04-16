import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Citrus } from 'lucide-react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { Toaster } from 'sonner'

import ProgressProvider from './_components/progress-provider'
import UserNav from './_components/user-nav'

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
          <header className="sticky top-0 z-10 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* 左侧：Logo - 确保不缩水 */}
              <Link
                href="/"
                className="group flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tighter text-zinc-900 sm:gap-2 sm:text-xl"
              >
                <div className="group-hover:bg-primary rounded-xl bg-zinc-900 p-1.5 text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-zinc-900">
                  <Citrus
                    size={18}
                    className="sm:h-5 sm:w-5"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="flex items-baseline gap-0.5 select-none sm:gap-1">
                  LEMON
                  <span className="text-primary font-extrabold tracking-widest italic">
                    GALLERY
                  </span>
                </span>
              </Link>
              {/* 右侧：状态控制 */}
              <UserNav />
            </div>
          </header>
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
