import { db } from "@/db";
import { assets } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { title, fileKey } = await request.json();

  // 拼接公共访问 URL (假设你开启了 R2 的 Public Domain)
  const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`;

  const newAsset = await db
    .insert(assets)
    .values({
      userId,
      title: title || "未命名资源",
      r2Key: fileKey,
      url: publicUrl,
      // categoryId: ... 可以后续扩展
    })
    .returning();

  return NextResponse.json(newAsset[0]);
}
