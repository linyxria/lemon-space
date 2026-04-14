'use client'

import {
  ClerkLoaded,
  ClerkLoading,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'
import { Citrus, LayoutGrid, UploadCloud } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function Header() {
  return (
    <header className="sticky top-0 z-100 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 左侧：Logo - 确保不缩水 */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tighter text-zinc-900 sm:gap-2 sm:text-xl"
        >
          <div className="group-hover:bg-primary rounded-xl bg-zinc-900 p-1.5 text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-zinc-900">
            <Citrus size={18} className="sm:h-5 sm:w-5" strokeWidth={2.5} />
          </div>
          <span className="flex items-baseline gap-0.5 select-none sm:gap-1">
            LEMON
            <span className="text-primary font-extrabold tracking-widest italic">
              GALLERY
            </span>
          </span>
        </Link>
        {/* 右侧：状态控制 */}
        <div className="ml-2 flex items-center gap-2 md:gap-4">
          <ClerkLoading>
            <div className="flex w-fit items-center gap-4">
              <div className="grid gap-2">
                <Skeleton className="h-4 w-24 md:w-37.5" />
                <Skeleton className="h-4 w-16 md:w-25" />
              </div>
              <Skeleton className="size-10 shrink-0 rounded-full" />
            </div>
          </ClerkLoading>
          <ClerkLoaded>
            <Show when="signed-out">
              <div className="flex items-center gap-1 sm:gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost">登录</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>注册</Button>
                </SignUpButton>
              </div>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* 发布按钮：手机端 shrink-0 保证不被挤压成椭圆 */}
                <Link href="/upload" className="shrink-0">
                  <Button variant="secondary">
                    <UploadCloud size={18} />
                    <span className="hidden sm:inline">发布灵感</span>
                  </Button>
                </Link>

                {/* 用户按钮 */}
                <div className="flex shrink-0 items-center">
                  <UserButton
                    showName
                    appearance={{
                      elements: {
                        avatarBox:
                          'h-9 w-9 border-2 border-white shadow-sm ring-1 ring-zinc-200',
                        userButtonBox: 'flex-row-reverse',
                        // 精准隐藏手机端名称
                        userButtonOuterIdentifier:
                          'hidden sm:block font-bold text-zinc-700 ml-2',
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="我的画廊"
                        href="/profile"
                        labelIcon={<LayoutGrid size={16} />}
                      />
                      <UserButton.Action label="manageAccount" />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              </div>
            </Show>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  )
}
