import axios from 'axios'

import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '@/app/api/s3/presigned-url/route'
import { getFileHash } from '@/lib/utils'

/**
 * 纯粹的文件上传逻辑
 * 返回 objectKey，不涉及任何具体的业务数据库操作
 */
export async function uploadFileToCloud(
  file: File,
  onProgress?: (percent: number) => void,
) {
  // 1. 获取文件 Hash
  const hash = await getFileHash(file)

  // 2. 请求预签名 URL
  const {
    data: { signedUrl, objectKey },
  } = await axios.post<PresignedUrlResponse>('/api/s3/presigned-url', {
    filename: file.name,
    hash,
    contentType: file.type,
    folder: 'images',
  } satisfies PresignedUrlRequest)

  // 3. 执行上传
  await axios.put(signedUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: ({ loaded, total }) => {
      const percent = total ? Math.round((loaded * 100) / total) : 0
      onProgress?.(percent)
    },
  })

  // 只返回标识符和 Hash，供后续业务使用
  return { objectKey, hash }
}
