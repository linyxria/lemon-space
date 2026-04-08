'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Citrus, LayoutGrid, Upload } from 'lucide-react'
import Link from 'next/link'

import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="sticky top-0 z-100 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 左侧：Logo - 确保不缩水 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-black tracking-tighter text-zinc-900 group shrink-0"
        >
          <div className="rounded-xl bg-zinc-900 p-1.5 text-white transition-all duration-300 group-hover:bg-lime-400 group-hover:text-zinc-900 group-hover:rotate-12 group-hover:scale-110 shadow-sm">
            <Citrus size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
          </div>
          <span className="flex items-baseline gap-0.5 sm:gap-1 select-none">
            LEMON
            <span className="text-lime-500 font-extrabold tracking-widest italic">
              GALLERY
            </span>
          </span>
        </Link>

        {/* 右侧：状态控制 */}
        <div className="flex items-center gap-2 sm:gap-4 ml-2">
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
                <Button variant="outline">
                  <Upload size={18} />
                  <span className="hidden sm:inline">发布灵感</span>
                </Button>
              </Link>

              {/* 用户按钮 */}
              <div className="shrink-0 flex items-center">
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
        </div>
      </div>
    </header>
  )
}
