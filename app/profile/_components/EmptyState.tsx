import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-100 rounded-[2.5rem] bg-zinc-50/30">
      <div className="h-14 w-14 bg-white shadow-sm border border-zinc-100 rounded-2xl flex items-center justify-center text-lime-500 mb-6">
        <Sparkles size={28} strokeWidth={1.5} />
      </div>

      <h3 className="font-black text-xl text-zinc-900 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-zinc-400 mt-2 max-w-50 text-center leading-relaxed">
        {description}
      </p>

      <Link
        href="/"
        className="mt-8 group relative inline-flex items-center gap-2 text-sm font-black text-zinc-900 transition-all"
      >
        {/* 文字装饰：一个精致的青柠色下划线动画 */}
        <span className="relative">
          回到首页浏览
          <span className="absolute -bottom-1 left-0 h-0.75 w-0 bg-lime-400 transition-all duration-300 group-hover:w-full" />
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  )
}
