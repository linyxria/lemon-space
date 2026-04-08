// 定义基础约束：必须包含 id 字段
interface BaseItem {
  id: string | number
}

// 泛型 T 继承 BaseItem，确保类型安全
interface MasonryGridProps<T extends BaseItem> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  columns?: string // 选填：允许外部自定义列数
}

export default function MasonryGrid<T extends BaseItem>({
  items,
  renderItem,
}: MasonryGridProps<T>) {
  return (
    <div className="columns-2 gap-2 md:columns-3 md:gap-3 lg:columns-4 lg:gap-4">
      {items.map((item, index) => (
        <div key={item.id} className="break-inside-avoid mb-2 md:mb-3 lg:mb-4">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
