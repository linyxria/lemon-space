"use server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { likes } from "@/db/schema";

export async function toggleLike(assetId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.assetId, assetId)));

  if (existing.length > 0) {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.assetId, assetId)));
  } else {
    await db.insert(likes).values({ userId, assetId });
  }

  // 关键：通知 Next.js 刷新数据缓存
  revalidatePath("/");
  revalidatePath("/profile");
}
