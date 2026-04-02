"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(assetId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.assetId, assetId)));

  if (existing.length > 0) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.assetId, assetId)));
  } else {
    await db.insert(favorites).values({ userId, assetId });
  }

  // 关键：通知 Next.js 刷新数据缓存
  revalidatePath("/gallery");
  revalidatePath("/profile");
}
