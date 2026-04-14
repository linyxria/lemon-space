import Link from 'next/link'

interface Tag {
  id: string | number
  name: string
  slug: string
}

interface TagBarProps {
  tags: Tag[]
  activeTagSlug?: string
}

export default function TagBar({ tags, activeTagSlug }: TagBarProps) {
  return (
    <nav className="w-full overflow-hidden">
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 pb-2 md:gap-2 md:pb-0">
          {tags.map((tag) => {
            const isActive = activeTagSlug === tag.slug
            return (
              <Link
                key={tag.id}
                href={`/?tag=${tag.slug}`}
                className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-300 md:px-5 md:py-2 md:text-sm ${
                  isActive
                    ? 'bg-lime-100 text-lime-700 shadow-sm shadow-lime-100/20'
                    : 'bg-transparent text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600'
                } `}
              >
                {tag.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
