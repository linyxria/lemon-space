'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Save, Send, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { RichTextEditor } from '@/components/post/rich-text-editor'
import type { RichTextContent } from '@/components/post/rich-text-renderer'
import TagInput from '@/components/tag-input'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { uploadFile } from '@/lib/s3'
import { useTRPC } from '@/trpc/client'

type EditorPost = {
  id?: string
  title: string
  excerpt: string
  coverImageUrl?: string | null
  content: string
  contentJson?: RichTextContent | null
  status: string
  tags: Array<{ name: string }>
}

const postFormSchema = z.object({
  title: z.string().trim().min(1, '请输入标题').max(120, '标题最多 120 个字符'),
  excerpt: z
    .string()
    .trim()
    .min(1, '请输入摘要')
    .max(280, '摘要最多 280 个字符'),
  coverImageUrl: z
    .string()
    .trim()
    .refine((value) => !value || URL.canParse(value), '请输入有效的图片 URL'),
  content: z.string().trim().min(20, '正文至少需要 20 个字符'),
  contentJson: z.custom<RichTextContent>().nullable(),
  tags: z.array(z.string().trim().min(1).max(32)).max(8, '最多添加 8 个标签'),
})

type PostFormValues = z.infer<typeof postFormSchema>

const emptyContent = `## 写下这一节的主题

这里写正文。支持 **加粗**、\`行内代码\`、引用、列表和代码块。

> 把一段想强调的话放在这里。

- 一个要点
- 另一个要点`

export function PostEditor({ post }: { post?: EditorPost }) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [coverUploading, setCoverUploading] = useState(false)
  const [editorImageUploading, setEditorImageUploading] = useState(false)
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: post?.title ?? '',
      excerpt: post?.excerpt ?? '',
      coverImageUrl: post?.coverImageUrl ?? '',
      content: post?.content ?? emptyContent,
      contentJson: post?.contentJson ?? null,
      tags: post?.tags.map((tag) => tag.name) ?? [],
    },
  })

  const createMutation = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.post.myList.queryKey(),
        })
        toast.success('文章已保存')
        router.push(`/posts/${data.id}`)
      },
    }),
  )

  const updateMutation = useMutation(
    trpc.post.update.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.post.myList.queryKey(),
        })
        toast.success('文章已更新')
        router.push(`/posts/${data.id}`)
      },
    }),
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const uploadPostImage = async (file: File) => {
    const { url } = await uploadFile('posts', file)
    return url
  }

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return

    setCoverUploading(true)
    try {
      const url = await uploadPostImage(file)
      form.setValue('coverImageUrl', url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      toast.success('封面已上传')
    } catch {
      toast.error('封面上传失败')
    } finally {
      setCoverUploading(false)
    }
  }

  const handleEditorImageUpload = async (file: File) => {
    setEditorImageUploading(true)
    try {
      const url = await uploadPostImage(file)
      toast.success('图片已插入')
      return url
    } catch {
      toast.error('图片上传失败')
      throw new Error('Image upload failed')
    } finally {
      setEditorImageUploading(false)
    }
  }

  const handleSubmit = (status: 'draft' | 'published') =>
    form.handleSubmit((values) => {
      const payload = {
        title: values.title.trim(),
        excerpt: values.excerpt.trim(),
        coverImageUrl: values.coverImageUrl.trim() || undefined,
        content: values.content.trim(),
        contentJson: values.contentJson,
        status,
        tags: values.tags,
      }

      if (post?.id) {
        updateMutation.mutate({ ...payload, postId: post.id })
        return
      }

      createMutation.mutate(payload)
    })()

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.48fr)]">
      <section className="space-y-4">
        <FieldSet className="bg-card rounded-lg border p-5" disabled={isPending}>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>标题</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="例如：我如何整理一个长期写作系统"
                    className="h-11 text-base"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <div className="grid gap-4">
              <Controller
                name="coverImageUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>封面图片 URL</FieldLabel>
                    <div className="grid gap-2">
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="https://..."
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="border-border bg-background hover:bg-muted inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors has-disabled:pointer-events-none has-disabled:opacity-50">
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={coverUploading}
                            onChange={(event) => {
                              void handleCoverUpload(event.target.files?.[0])
                              event.target.value = ''
                            }}
                          />
                          <UploadCloud className="size-3.5" />
                          {coverUploading ? '上传中...' : '上传本地图片'}
                        </label>
                        {field.value ? (
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                            <ImageIcon className="size-3.5" />
                            已设置封面
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="excerpt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>摘要</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="用一两句话说明这篇文章为什么值得读。"
                    className="min-h-24"
                  />
                  <FieldDescription>
                    {field.value.length}/280 个字符
                  </FieldDescription>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="tags"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>标签</FieldLabel>
                  <TagInput
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="输入标签后按 Enter"
                  />
                  <FieldDescription>最多 8 个标签。</FieldDescription>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="contentJson"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>正文</FieldLabel>
                  <RichTextEditor
                    value={field.value}
                    fallbackText={form.getValues('content')}
                    invalid={fieldState.invalid || !!form.formState.errors.content}
                    onUploadImage={handleEditorImageUpload}
                    onChange={(contentJson, plainText) => {
                      field.onChange(contentJson)
                      form.setValue('content', plainText, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }}
                  />
                  {editorImageUploading ? (
                    <FieldDescription>图片正在上传...</FieldDescription>
                  ) : null}
                  {form.formState.errors.content ? (
                    <FieldError errors={[form.formState.errors.content]} />
                  ) : fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="text-lg font-black">发布设置</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            草稿只有作者本人能看到；发布后会出现在文章首页、标签页和文章详情。
          </p>
          <div className="mt-5 grid gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleSubmit('draft')}
            >
              <Save className="size-4" />
              保存草稿
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit('published')}
            >
              <Send className="size-4" />
              发布文章
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
