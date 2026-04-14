import { type ClassValue, clsx } from 'clsx'
import slugify from 'slugify'
import { twMerge } from 'tailwind-merge'
import { transliterate } from 'transliteration'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAssetUrl(objectKey: string) {
  return `${process.env.R2_PUBLIC_DOMAIN}/${objectKey}`
}

export function chineseSlugify(text: string): string {
  // 先把中文转成拼音
  const pinyin = transliterate(text)

  // 再用 slugify 处理成 URL 友好格式
  return slugify(pinyin, {
    lower: true, // 转小写
    strict: true, // 严格去除特殊字符
    trim: true,
    replacement: '-', // 用 - 分隔
  })
}

export async function getFileHash(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // 转为 16 进制字符串
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function getSafeExtension(filename: string) {
  // 1. 找到最后一个点的位置
  const dotIndex = filename.lastIndexOf('.')

  // 2. 排除没有点的情况 (-1) 和 点在开头的情况 (0)
  if (dotIndex <= 0) return ''

  // 3. 正常提取并转小写
  return filename.slice(dotIndex + 1).toLowerCase()
}

export function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    image.src = URL.createObjectURL(file)
    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      }
      URL.revokeObjectURL(image.src) // 释放内存
      resolve(dimensions)
    }
  })
}
