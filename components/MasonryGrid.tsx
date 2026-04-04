// 定义基础约束：必须包含 id 字段
interface BaseItem {
  id: string | number;
}

// 泛型 T 继承 BaseItem，确保类型安全
interface MasonryGridProps<T extends BaseItem> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: string; // 选填：允许外部自定义列数
}

export default function MasonryGrid<T extends BaseItem>({
  items,
  renderItem,
  columns = "columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4", // 默认样式
}: MasonryGridProps<T>) {
  return (
    <div className={columns}>
      {items.map((item, index) => (
        <div
          key={item.id} // ✅ 这里现在有完美的类型提示，不再需要 as any
          className="mb-5 break-inside-avoid"
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
