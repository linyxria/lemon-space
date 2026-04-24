'use client'

import { Fragment, useMemo } from 'react'
import { useWindowSize } from 'react-use'

import { cn } from '@/lib/utils'

function defaultGetColumnCount(width: number) {
  if (width < 768) return 2
  if (width < 1024) return 3
  return 4
}

export function MasonryGrid<T extends { id: string | number }>({
  items,
  renderItem,
  columnCount = defaultGetColumnCount,
  gapClassName = 'gap-2 md:gap-4',
  className,
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  columnCount?: number | ((width: number) => number)
  gapClassName?: string
  className?: string
}) {
  const { width } = useWindowSize()

  const resolvedColumnCount = useMemo(() => {
    const count =
      typeof columnCount === 'function' ? columnCount(width) : columnCount
    return Math.max(1, Math.floor(count))
  }, [columnCount, width])

  const columns = useMemo(() => {
    const result: Array<Array<{ item: T; index: number }>> = Array.from(
      { length: resolvedColumnCount },
      () => [],
    )

    // Row-major 分发：
    // 0,1,2,3 -> 第一行从左到右；4,5,6,7 -> 第二行从左到右。
    // 这样“最新内容”视觉顺序是从左到右，不会变成按列向下读取。
    items.forEach((item, index) => {
      result[index % resolvedColumnCount].push({ item, index })
    })

    return result
  }, [items, resolvedColumnCount])

  return (
    <div className={cn('flex items-start', gapClassName, className)}>
      {columns.map((columnItems, colIndex) => (
        <div key={colIndex} className={cn('flex flex-1 flex-col', gapClassName)}>
          {columnItems.map(({ item, index }) => (
            <Fragment key={item.id}>{renderItem(item, index)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}
