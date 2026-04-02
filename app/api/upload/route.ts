import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { crypto } from "next/dist/compiled/@edge-runtime/primitives"; // 或者直接用全局的 crypto

export async function POST(request: Request) {
  try {
    const { fileName, contentType } = await request.json();

    // 优雅的文件名：UUID + 原始后缀
    const fileExtension = fileName.split(".").pop();
    const fileKey = `uploads/${crypto.randomUUID()}.${fileExtension}`;

    // 1. 生成 R2 预签名 URL
    const clientMethod = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(r2, clientMethod, { expiresIn: 60 });

    // 2. 这里的优雅做法是：等前端传完再写库，或者现在先生成一个“待上传”记录
    // 为了简单且保证数据一致性，我们先返回给前端，前端传完后再 call 一个 `save` 接口
    // 或者直接在这里返回 fileKey

    return NextResponse.json({
      url: signedUrl,
      fileKey: fileKey,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
