import { S3Client } from '@aws-sdk/client-s3'
import axios from 'axios'

import { api } from '@/trpc/client'

export const s3client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const CACHE_CONTROL_BY_FOLDER = {
  assets: 'public, max-age=31536000, immutable',
  avatars: 'public, max-age=31536000, immutable',
}

function getSafeExtension(filename: string) {
  // 1. 找到最后一个点的位置
  const dotIndex = filename.lastIndexOf('.')

  // 2. 排除没有点的情况 (-1) 和 点在开头的情况 (0)
  if (dotIndex <= 0) return ''

  // 3. 正常提取并转小写
  return filename.slice(dotIndex + 1).toLowerCase()
}

async function getFileHash(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // 转为 16 进制字符串
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 纯粹的文件上传逻辑
 * 返回 objectKey，不涉及任何具体的业务数据库操作
 */
export async function uploadFile(
  folder: 'assets' | 'avatars',
  file: File,
  { onProgress }: { onProgress?: (percent: number) => void } = {},
) {
  const hash = await getFileHash(file)
  const objectKey = `${folder}/${hash}.${getSafeExtension(file.name) || 'bin'}`
  const cacheControl = CACHE_CONTROL_BY_FOLDER[folder]

  const signedUrl = await api.upload.signedUrl.query({
    Key: objectKey,
    ContentType: file.type,
    CacheControl: cacheControl,
  })

  // 3. 执行上传
  await axios.put(signedUrl, file, {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': file.type,
    },
    onUploadProgress: ({ loaded, total }) => {
      const percent = total ? Math.round((loaded * 100) / total) : 0
      onProgress?.(percent)
    },
  })

  return {
    objectKey,
    // hash,
  }
}
