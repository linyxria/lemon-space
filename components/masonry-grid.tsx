"use client"

import { Fragment, useMemo } from "react"
import { useWindowSize } from "react-use"

import { cn } from "@/lib/utils"

function defaultGetColumnCount(width: number) {
  if (width < 768) return 2
  if (width < 1024) return 3
  return 4
}

export function MasonryGrid<T extends { id: string | number }>({
  items,
  renderItem,
  columnCount = defaultGetColumnCount,
  gapClassName = "gap-2 md:gap-4",
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
      typeof columnCount === "function" ? columnCount(width) : columnCount
    return Math.max(1, Math.floor(count))
  }, [columnCount, width])

  const columns = useMemo(() => {
    const result: Array<Array<{ item: T; index: number }>> = Array.from(
      { length: resolvedColumnCount },
      () => [],
    )

    // Row-major distribution keeps visual reading order left-to-right.
    items.forEach((item, index) => {
      result[index % resolvedColumnCount].push({ item, index })
    })

    return result
  }, [items, resolvedColumnCount])

  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 items-start overflow-x-clip",
        gapClassName,
        className,
      )}
    >
      {columns.map((columnItems, colIndex) => (
        <div
          key={colIndex}
          className={cn("flex min-w-0 flex-1 basis-0 flex-col", gapClassName)}
        >
          {columnItems.map(({ item, index }) => (
            <Fragment key={`${item.id}:${index}`}>
              {renderItem(item, index)}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}
