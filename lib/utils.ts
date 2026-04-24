import { type ClassValue, clsx } from 'clsx'
import slugify from 'slugify'
import { twMerge } from 'tailwind-merge'
import { transliterate } from 'transliteration'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function objectKey2Url(objectKey: string) {
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
