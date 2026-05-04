import type { JSONContent } from "@tiptap/core"
import Link from "next/link"
import type { ReactNode } from "react"

export type RichTextContent = JSONContent

function renderMarks(node: RichTextContent, children: ReactNode) {
  return (node.marks ?? []).reduce<ReactNode>((current, mark) => {
    if (mark.type === "bold") return <strong>{current}</strong>
    if (mark.type === "italic") return <em>{current}</em>
    if (mark.type === "strike") return <s>{current}</s>
    if (mark.type === "code") return <code>{current}</code>
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#"
      return (
        <Link href={href} target="_blank" rel="noreferrer">
          {current}
        </Link>
      )
    }

    return current
  }, children)
}

function renderChildren(
  nodes: RichTextContent[] | undefined,
  keyPrefix: string,
) {
  return nodes?.map((child, index) =>
    renderNode(child, `${keyPrefix}-${index}`),
  )
}

function renderNode(node: RichTextContent, key: string): ReactNode {
  if (node.type === "text") {
    return <span key={key}>{renderMarks(node, node.text)}</span>
  }

  if (node.type === "paragraph") {
    return <p key={key}>{renderChildren(node.content, key)}</p>
  }

  if (node.type === "heading") {
    const level = Number(node.attrs?.level ?? 2)
    const children = renderChildren(node.content, key)
    if (level === 1) return <h1 key={key}>{children}</h1>
    if (level === 3) return <h3 key={key}>{children}</h3>
    if (level === 4) return <h4 key={key}>{children}</h4>
    return <h2 key={key}>{children}</h2>
  }

  if (node.type === "bulletList") {
    return <ul key={key}>{renderChildren(node.content, key)}</ul>
  }

  if (node.type === "orderedList") {
    return <ol key={key}>{renderChildren(node.content, key)}</ol>
  }

  if (node.type === "listItem") {
    return <li key={key}>{renderChildren(node.content, key)}</li>
  }

  if (node.type === "blockquote") {
    return (
      <blockquote key={key}>{renderChildren(node.content, key)}</blockquote>
    )
  }

  if (node.type === "codeBlock") {
    return (
      <pre key={key}>
        <code>{node.content?.map((child) => child.text ?? "").join("")}</code>
      </pre>
    )
  }

  if (node.type === "hardBreak") {
    return <br key={key} />
  }

  if (node.type === "horizontalRule") {
    return <hr key={key} />
  }

  if (node.type === "image") {
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : ""
    const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : ""

    if (!src) return null

    // eslint-disable-next-line @next/next/no-img-element
    return <img key={key} src={src} alt={alt} />
  }

  return <div key={key}>{renderChildren(node.content, key)}</div>
}

export function RichTextRenderer({ content }: { content: RichTextContent }) {
  return (
    <div className="[&_a]:text-primary [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_hr]:border-border [&_pre]:bg-muted max-w-none text-base leading-8 [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-4xl [&_h1]:font-black [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-2xl [&_h3]:font-bold [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-xl [&_h4]:font-bold [&_hr]:my-8 [&_img]:my-6 [&_img]:max-h-[620px] [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:object-cover [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
      {renderChildren(content.content, "rich-text")}
    </div>
  )
}
