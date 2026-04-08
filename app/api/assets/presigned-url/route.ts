import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

import { client } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { fileName, contentType } = await request.json();

    // 优雅的文件名：UUID + 原始后缀
    const fileExtension = fileName.split(".").pop();
    const objectKey = `uploads/${crypto.randomUUID()}.${fileExtension}`;

    // 1. 生成 R2 预签名 URL
    const clientMethod = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(client, clientMethod, {
      expiresIn: 60,
    });

    return NextResponse.json({ signedUrl, objectKey });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
