"use client"

import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Code,
  FileCode2,
  Heading2,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { RichTextContent } from "./rich-text-renderer"

function textToDoc(text: string): RichTextContent {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    type: "doc",
    content:
      paragraphs.length > 0
        ? paragraphs.map((paragraph) => ({
            type: "paragraph",
            content: [{ type: "text", text: paragraph }],
          }))
        : [{ type: "paragraph" }],
  }
}

function parseInlineMarkdown(text: string): RichTextContent[] {
  const nodes: RichTextContent[] = []
  const pattern =
    /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) })
    }

    if (match[2] && match[3]) {
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "link", attrs: { href: match[3] } }],
      })
    } else if (match[4]) {
      nodes.push({ type: "text", text: match[4], marks: [{ type: "code" }] })
    } else if (match[5]) {
      nodes.push({ type: "text", text: match[5], marks: [{ type: "bold" }] })
    } else if (match[6]) {
      nodes.push({ type: "text", text: match[6], marks: [{ type: "italic" }] })
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }]
}

function markdownParagraph(text: string): RichTextContent {
  return {
    type: "paragraph",
    content: parseInlineMarkdown(text),
  }
}

function parseMarkdownToDoc(markdown: string): RichTextContent {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  const content: RichTextContent[] = []
  let index = 0
  let paragraphLines: string[] = []

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").trim()
    if (text) content.push(markdownParagraph(text))
    paragraphLines = []
  }

  while (index < lines.length) {
    const line = lines[index] ?? ""
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      index += 1
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      content.push({
        type: "heading",
        attrs: { level: heading[1].length },
        content: parseInlineMarkdown(heading[2]),
      })
      index += 1
      continue
    }

    if (/^```/.test(trimmed)) {
      flushParagraph()
      index += 1
      const codeLines: string[] = []
      while (index < lines.length && !/^```/.test(lines[index]?.trim() ?? "")) {
        codeLines.push(lines[index] ?? "")
        index += 1
      }
      if (index < lines.length) index += 1
      content.push({
        type: "codeBlock",
        content: [{ type: "text", text: codeLines.join("\n") }],
      })
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph()
      const quoteLines: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index]?.trim() ?? "")) {
        quoteLines.push((lines[index] ?? "").trim().replace(/^>\s?/, ""))
        index += 1
      }
      content.push({
        type: "blockquote",
        content: [markdownParagraph(quoteLines.join(" "))],
      })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      const items: RichTextContent[] = []
      while (
        index < lines.length &&
        /^[-*]\s+/.test(lines[index]?.trim() ?? "")
      ) {
        items.push({
          type: "listItem",
          content: [
            markdownParagraph(
              (lines[index] ?? "").trim().replace(/^[-*]\s+/, ""),
            ),
          ],
        })
        index += 1
      }
      content.push({ type: "bulletList", content: items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      const items: RichTextContent[] = []
      while (
        index < lines.length &&
        /^\d+\.\s+/.test(lines[index]?.trim() ?? "")
      ) {
        items.push({
          type: "listItem",
          content: [
            markdownParagraph(
              (lines[index] ?? "").trim().replace(/^\d+\.\s+/, ""),
            ),
          ],
        })
        index += 1
      }
      content.push({ type: "orderedList", content: items })
      continue
    }

    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed)
    if (image) {
      flushParagraph()
      content.push({
        type: "image",
        attrs: { alt: image[1], src: image[2] },
      })
      index += 1
      continue
    }

    paragraphLines.push(trimmed)
    index += 1
  }

  flushParagraph()

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  }
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-8",
        active && "border-primary/40 text-primary ring-primary/25 ring-1",
      )}
    >
      {children}
    </Button>
  )
}

export function RichTextEditor({
  value,
  fallbackText,
  invalid,
  onChange,
  onUploadImage,
}: {
  value: RichTextContent | null
  fallbackText: string
  invalid?: boolean
  onChange: (contentJson: RichTextContent, plainText: string) => void
  onUploadImage?: (file: File) => Promise<string>
}) {
  const [panel, setPanel] = useState<"link" | "image" | "markdown" | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [markdownText, setMarkdownText] = useState("")
  const [uploading, setUploading] = useState(false)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          defaultProtocol: "https",
          openOnClick: false,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg border",
        },
      }),
      Placeholder.configure({
        placeholder: "写点什么...",
      }),
      Typography,
    ],
    content: value ?? textToDoc(fallbackText),
    editorProps: {
      attributes: {
        class:
          "min-h-120 max-w-none px-5 py-4 text-base leading-6 outline-none [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-xl [&_h3]:font-bold [&_hr]:my-5 [&_hr]:border-border [&_img]:my-3 [&_img]:max-h-120 [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:object-cover [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as RichTextContent, editor.getText())
    },
  })

  const setLink = () => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href as string | undefined
    setLinkUrl(previousUrl ?? "")
    setPanel((value) => (value === "link" ? null : "link"))
  }

  const applyLink = () => {
    if (!editor) return

    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      setPanel(null)
      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl.trim() })
      .run()
    setPanel(null)
  }

  const removeLink = () => {
    if (!editor) return

    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setLinkUrl("")
    setPanel(null)
  }

  const addImageUrl = () => {
    if (!editor) return

    if (!imageUrl.trim()) return

    editor.chain().focus().setImage({ src: imageUrl.trim() }).run()
    setImageUrl("")
    setPanel(null)
  }

  const uploadImage = async (file: File | undefined) => {
    if (!file || !editor || !onUploadImage) return

    setUploading(true)
    try {
      const url = await onUploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
      setPanel(null)
    } finally {
      setUploading(false)
    }
  }

  const insertMarkdown = () => {
    if (!editor || !markdownText.trim()) return

    const doc = parseMarkdownToDoc(markdownText)
    editor
      .chain()
      .focus()
      .insertContent(doc.content ?? [])
      .run()
    setMarkdownText("")
    setPanel(null)
  }

  return (
    <div
      className={cn(
        "bg-background overflow-hidden rounded-lg border",
        invalid && "border-destructive",
      )}
    >
      <div className="bg-muted/40 flex flex-wrap items-center gap-1 border-b p-2">
        <ToolbarButton
          label="撤销"
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="重做"
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
        <span className="bg-border mx-1 h-5 w-px" />
        <ToolbarButton
          label="二级标题"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="加粗"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="删除线"
          active={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="行内代码"
          active={editor?.isActive("code")}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <span className="bg-border mx-1 h-5 w-px" />
        <ToolbarButton
          label="无序列表"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="有序列表"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <span className="bg-border mx-1 h-5 w-px" />
        <ToolbarButton
          label="链接"
          active={editor?.isActive("link")}
          onClick={setLink}
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="图片"
          onClick={() =>
            setPanel((value) => (value === "image" ? null : "image"))
          }
        >
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="插入 Markdown"
          active={panel === "markdown"}
          onClick={() =>
            setPanel((value) => (value === "markdown" ? null : "markdown"))
          }
        >
          <FileCode2 className="size-4" />
        </ToolbarButton>
      </div>
      {panel ? (
        <div className="bg-muted/20 grid gap-2 border-b p-3 md:grid-cols-[minmax(0,1fr)_auto]">
          {panel === "link" ? (
            <>
              <Input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://example.com"
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyLink()
                }}
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={applyLink}>
                  应用链接
                </Button>
                <Button type="button" variant="outline" onClick={removeLink}>
                  移除
                </Button>
              </div>
            </>
          ) : panel === "image" ? (
            <>
              <div className="grid gap-2">
                <Input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/image.png"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addImageUrl()
                  }}
                />
                {onUploadImage ? (
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(event) => {
                      void uploadImage(event.target.files?.[0])
                      event.target.value = ""
                    }}
                  />
                ) : null}
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!imageUrl.trim() || uploading}
                onClick={addImageUrl}
              >
                插入图片
              </Button>
            </>
          ) : (
            <>
              <Textarea
                value={markdownText}
                onChange={(event) => setMarkdownText(event.target.value)}
                placeholder={
                  "## 标题\n\n正文支持 **加粗**、`代码`、[链接](https://example.com)\n\n- 列表项\n> 引用"
                }
                className="min-h-40 font-mono text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!markdownText.trim()}
                onClick={insertMarkdown}
              >
                插入 Markdown
              </Button>
            </>
          )}
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}
