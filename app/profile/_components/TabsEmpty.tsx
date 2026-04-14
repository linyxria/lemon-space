import { ArrowRightToLine, Sparkles } from 'lucide-react'
import Link from 'next/link'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function TabsEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="bg-muted/30 h-full">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="text-primary border-border flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm"
        >
          <Sparkles size={28} strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href="/"
          className="text-muted-foreground decoration-primary hover:text-primary flex items-center gap-2 underline decoration-2 underline-offset-8 transition-colors duration-300"
        >
          回到首页浏览
          <ArrowRightToLine size={18} />
        </Link>
      </EmptyContent>
    </Empty>
  )
}
