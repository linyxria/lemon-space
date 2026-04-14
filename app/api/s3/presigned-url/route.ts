import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

import { s3client } from '@/lib/s3'
import { getSafeExtension } from '@/lib/utils'

export interface PresignedUrlRequest {
  filename: string
  hash: string
  contentType: string
  folder: 'images'
}

export interface PresignedUrlResponse {
  signedUrl: string
  objectKey: string
}

export async function POST(request: Request) {
  try {
    const { filename, hash, contentType, folder }: PresignedUrlRequest =
      await request.json()

    // 优雅的文件名：UUID + 原始后缀
    const objectKey = `${folder}/${hash}.${getSafeExtension(filename) || 'bin'}`

    // 1. 生成 R2 预签名 URL
    const clientMethod = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    })

    const signedUrl = await getSignedUrl(s3client, clientMethod, {
      expiresIn: 60,
    })

    return NextResponse.json<PresignedUrlResponse>({ signedUrl, objectKey })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
