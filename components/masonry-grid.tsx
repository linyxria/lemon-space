"use client"

import { useWindowSize } from "react-use"

import { cn } from "@/lib/utils"

function defaultGetColumnCount(width: number) {
  if (width < 768) return 2
  if (width < 1024) return 3
  return 4
}

const COLUMN_KEYS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
]

export function MasonryGrid<T extends { id: string | number }>({
  items,
  itemNode,
  columnCount = defaultGetColumnCount,
  gapClassName = "gap-2 md:gap-4",
  className,
}: {
  items: T[]
  itemNode: (item: T, index: number) => React.ReactNode
  columnCount?: number | ((width: number) => number)
  gapClassName?: string
  className?: string
}) {
  const { width } = useWindowSize()

  const count =
    typeof columnCount === "function" ? columnCount(width) : columnCount
  const resolvedColumnCount = Math.max(1, Math.floor(count))

  const columns: Array<Array<{ item: T; index: number }>> = Array.from(
    { length: resolvedColumnCount },
    () => [],
  )

  // Row-major distribution keeps visual reading order left-to-right.
  items.forEach((item, index) => {
    columns[index % resolvedColumnCount].push({ item, index })
  })

  const renderedColumns = columns.map((columnItems, columnIndex) => {
    const renderedItems = columnItems.map(({ item, index }) => (
      <div key={item.id}>{itemNode(item, index)}</div>
    ))

    return (
      <div
        key={COLUMN_KEYS[columnIndex] ?? `column-${resolvedColumnCount}`}
        className={cn("flex min-w-0 flex-1 basis-0 flex-col", gapClassName)}
      >
        {renderedItems}
      </div>
    )
  })

  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 items-start overflow-x-clip",
        gapClassName,
        className,
      )}
    >
      {renderedColumns}
    </div>
  )
}
