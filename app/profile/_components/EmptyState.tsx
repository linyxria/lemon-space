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
    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-20">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-100 bg-white text-lime-500 shadow-sm">
        <Sparkles size={28} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-black tracking-tight text-zinc-900">
        {title}
      </h3>
      <p className="mt-2 max-w-50 text-center text-sm leading-relaxed text-zinc-400">
        {description}
      </p>

      <Link
        href="/"
        className="group relative mt-8 inline-flex items-center gap-2 text-sm font-black text-zinc-900 transition-all"
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
