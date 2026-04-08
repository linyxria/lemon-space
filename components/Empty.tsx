'use client'
import { useAuth, useClerk } from '@clerk/nextjs'
import { ImageIcon, Plus, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from './ui/button'

export default function Empty() {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const router = useRouter()

  const handlePublish = () => {
    if (isSignedIn) {
      router.push('/upload') // 已登录，去上传
    } else {
      openSignIn({ fallbackRedirectUrl: '/upload' })
    }
  }

  return (
    <div className="relative group max-w-md w-full mx-auto">
      {/* 背景装饰：改为青柠色渐变晕染 */}
      <div className="absolute -inset-4 bg-linear-to-r from-lime-400/10 to-emerald-400/5 rounded-[40px] blur-2xl transition-all group-hover:from-lime-400/20 group-hover:to-emerald-400/10" />

      <div className="relative flex flex-col items-center bg-white border border-zinc-100 rounded-[32px] p-12 text-center shadow-sm">
        {/* 图标组合 */}
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300">
            <ImageIcon size={40} strokeWidth={1.5} />
          </div>
          {/* 这里的蓝色背景改为 lime-400，文字改为深色以保持对比 */}
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-lime-400 flex items-center justify-center text-lime-950 shadow-lg shadow-lime-200 animate-bounce">
            <Plus size={16} strokeWidth={3} />
          </div>
        </div>

        {/* 文字描述 */}
        <h3 className="text-xl font-black text-zinc-900 tracking-tight">
          灵感库空空如也
        </h3>
        <p className="mt-2 mb-8 text-zinc-500 text-sm leading-relaxed px-4">
          这里暂时还没有任何资源。
          <br />
          作为先驱者，来发布第一条灵感吧！
        </p>

        <Button onClick={handlePublish}>
          <Sparkles size={16} />
          立即发布
        </Button>
      </div>
    </div>
  )
}
