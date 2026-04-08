import { auth } from '@clerk/nextjs/server'
import { eq, sql } from 'drizzle-orm'
import { FolderUp, Heart } from 'lucide-react'
import { Suspense } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/db'
import { assets, likes } from '@/db/schema'

import LikedList from './_components/LikedList'
import UploadList from './_components/UploadList'

export default async function ProfilePage() {
  const { userId } = await auth()

  if (!userId) return null

  const [uploadsCount, likesCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(eq(assets.userId, userId))
      .then((res) => Number(res[0].count)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.userId, userId))
      .then((res) => Number(res[0].count)),
  ])

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
          个人中心
        </h1>
        <p className="text-zinc-500 mt-2">管理你的灵感与上传资源</p>
      </div>

      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="bg-zinc-100 p-1 rounded-xl mb-4">
          <TabsTrigger
            value="uploads"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <FolderUp size={16} />
            我的上传 ({uploadsCount})
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <Heart size={16} />
            我喜爱的 ({likesCount})
          </TabsTrigger>
        </TabsList>

        {/* --- 我的上传 Tab --- */}
        <TabsContent value="uploads">
          <Suspense
            fallback={
              <div className="py-20 text-center text-zinc-400">
                正在整理你的作品...
              </div>
            }
          >
            <UploadList userId={userId} />
          </Suspense>
        </TabsContent>

        {/* --- 我的收藏 Tab --- */}
        <TabsContent value="likes">
          <Suspense
            fallback={
              <div className="py-20 text-center text-zinc-400">
                正在加载你的喜爱列表...
              </div>
            }
          >
            <LikedList userId={userId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
