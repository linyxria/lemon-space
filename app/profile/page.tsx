import { eq, sql } from 'drizzle-orm'
import { FolderUp, Heart } from 'lucide-react'
import { Suspense } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { db } from '@/db'
import { asset, like } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { objectKey2Url } from '@/lib/utils'

import AvatarUploadCard from './_components/avatar-upload-card'
import LikedList from './_components/liked-list'
import UploadList from './_components/upload-list'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) return null

  const userId = session.user.id

  const [myCount, likeCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(asset)
      .where(eq(asset.userId, userId))
      .then((res) => Number(res[0].count)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(like)
      .where(eq(like.userId, userId))
      .then((res) => Number(res[0].count)),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      <div className="mb-8 rounded-[28px] bg-linear-to-r from-zinc-950 via-zinc-900 to-lime-950/90 px-5 py-5 text-white shadow-[0_20px_50px_-28px_rgba(24,24,27,0.6)] sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-lime-200/80 uppercase">
          Profile Space
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          个人中心
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-[15px]">
          管理你的头像、上传作品和收藏内容，把这个页面变成你在 Lemon
          Gallery 的个人名片。
        </p>
      </div>

      <AvatarUploadCard
        name={session.user.name}
        email={session.user.email}
        image={session.user.image ? objectKey2Url(session.user.image) : null}
      />

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="mb-4 rounded-xl bg-zinc-100 p-1">
          <TabsTrigger
            value="my"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <FolderUp size={16} />
            我的上传 ({myCount})
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <Heart size={16} />
            我喜爱的 ({likeCount})
          </TabsTrigger>
        </TabsList>

        {/* --- 我的上传 Tab --- */}
        <TabsContent value="my">
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
