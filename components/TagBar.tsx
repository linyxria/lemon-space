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
    <nav className="w-full">
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 md:gap-2 pb-2 md:pb-0">
          {tags.map((tag) => {
            const isActive = activeTagSlug === tag.slug
            return (
              <Link
                key={tag.id}
                href={`/?tag=${tag.slug}`}
                className={`
                  px-4 py-1.5 md:px-5 md:py-2 
                  rounded-full text-xs md:text-sm font-bold
                  transition-all duration-300 whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-lime-100 text-lime-700 shadow-sm shadow-lime-100/20'
                      : 'bg-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50'
                  }
                `}
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
