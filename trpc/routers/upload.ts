import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import z from 'zod'

import { s3client } from '@/lib/s3'

import { protectedProcedure, router } from '../init'

export const uploadRouter = router({
  signedUrl: protectedProcedure
    .input(
      z.object({
        Key: z.string(),
        ContentType: z.string(),
        CacheControl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // 1. 生成预签名 URL
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: input.Key,
        ContentType: input.ContentType,
        CacheControl: input.CacheControl,
      })
      const signedUrl = await getSignedUrl(s3client, command, { expiresIn: 60 })
      return signedUrl
    }),
})
