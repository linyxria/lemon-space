import { cn } from "@/lib/utils"

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }

    return part
  })
}

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const lines = content.split("\n")
  const nodes: React.ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index])
        index += 1
      }

      nodes.push(
        <pre
          key={`code-${index}`}
          className="bg-foreground text-background overflow-x-auto rounded-lg p-4 text-sm leading-6"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      )
      index += 1
      continue
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={`h3-${index}`} className="pt-4 text-xl font-black">
          {renderInline(line.slice(4))}
        </h3>,
      )
      index += 1
      continue
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={`h2-${index}`} className="pt-6 text-2xl font-black">
          {renderInline(line.slice(3))}
        </h2>,
      )
      index += 1
      continue
    }

    if (line.startsWith("# ")) {
      nodes.push(
        <h2 key={`h1-${index}`} className="pt-6 text-3xl font-black">
          {renderInline(line.slice(2))}
        </h2>,
      )
      index += 1
      continue
    }

    if (line.startsWith("> ")) {
      const quoteLines = [line.slice(2)]
      index += 1

      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().slice(2))
        index += 1
      }

      nodes.push(
        <blockquote
          key={`quote-${index}`}
          className="border-primary bg-primary/5 text-foreground rounded-r-lg border-l-4 px-4 py-3"
        >
          {quoteLines.map((quote, quoteIndex) => (
            <p key={`${quote}-${quoteIndex}`}>{renderInline(quote)}</p>
          ))}
        </blockquote>,
      )
      continue
    }

    if (line.startsWith("- ")) {
      const items = [line.slice(2)]
      index += 1

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2))
        index += 1
      }

      nodes.push(
        <ul key={`list-${index}`} className="list-disc space-y-2 pl-6">
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    nodes.push(
      <p key={`p-${index}`} className="text-foreground/90 leading-8">
        {renderInline(line)}
      </p>,
    )
    index += 1
  }

  return (
    <div className={cn("space-y-5 text-base leading-8 md:text-lg", className)}>
      {nodes}
    </div>
  )
}
