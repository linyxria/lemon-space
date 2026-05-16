import { cn } from "@/lib/utils"

function inlineNodes(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  const seenParts = new Map<string, number>()

  return parts.map((part) => {
    const count = seenParts.get(part) ?? 0
    seenParts.set(part, count + 1)
    const key = `${part}-${count}`

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
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
          key={`code-${codeLines.join("\n")}`}
          className="bg-foreground text-background overflow-x-auto rounded-lg p-4 text-sm leading-6"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      )
      index += 1
      continue
    }

    if (line.startsWith("### ")) {
      const children = inlineNodes(line.slice(4))
      nodes.push(
        <h3 key={`h3-${line}`} className="pt-4 text-xl font-semibold">
          {children}
        </h3>,
      )
      index += 1
      continue
    }

    if (line.startsWith("## ")) {
      const children = inlineNodes(line.slice(3))
      nodes.push(
        <h2 key={`h2-${line}`} className="pt-6 text-2xl font-semibold">
          {children}
        </h2>,
      )
      index += 1
      continue
    }

    if (line.startsWith("# ")) {
      const children = inlineNodes(line.slice(2))
      nodes.push(
        <h2 key={`h1-${line}`} className="pt-6 text-3xl font-semibold">
          {children}
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

      const quoteNodes = quoteLines.map((quote) => (
        <p key={quote}>{inlineNodes(quote)}</p>
      ))

      nodes.push(
        <blockquote
          key={`quote-${quoteLines.join("\n")}`}
          className="border-primary/20 bg-primary/5 text-foreground rounded-lg border px-4 py-3"
        >
          {quoteNodes}
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

      const itemNodes = items.map((item) => (
        <li key={item}>{inlineNodes(item)}</li>
      ))

      nodes.push(
        <ul
          key={`list-${items.join("\n")}`}
          className="list-disc space-y-2 pl-6"
        >
          {itemNodes}
        </ul>,
      )
      continue
    }

    const children = inlineNodes(line)
    nodes.push(
      <p key={`p-${line}`} className="text-foreground/90 leading-8">
        {children}
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
