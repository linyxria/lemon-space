"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { BookMarked, BookOpenText, Heart, Images, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"

export function ProfileOverview() {
  const trpc = useTRPC()
  const t = useTranslations("ProfileOverview")
  const [avatarFailed, setAvatarFailed] = useState(false)
  const { data: info } = useSuspenseQuery(trpc.user.info.queryOptions())
  const { data: stats } = useSuspenseQuery(trpc.user.stats.queryOptions())

  const quickLinks = [
    {
      href: "/posts/me",
      icon: BookOpenText,
      label: t("myPosts"),
      value: stats.postCount,
    },
    {
      href: "/gallery/me",
      icon: Images,
      label: t("myGallery"),
      value: stats.assetCount,
    },
    {
      href: "/likes",
      icon: Heart,
      label: t("myLikes"),
      value: stats.likeCount,
    },
    {
      href: "/collections",
      icon: BookMarked,
      label: t("collections"),
      value: stats.collectionCount,
    },
  ]

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="from-card via-card to-primary/10 rounded-[28px] border bg-linear-to-br p-5 shadow-sm sm:p-6">
        <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] uppercase">
          <Sparkles className="text-primary size-3.5" />
          {t("snapshotBadge")}
        </div>
        <div className="mt-4 flex items-center gap-4">
          {info.image && !avatarFailed ? (
            <Image
              src={info.image}
              alt={info.name}
              width={72}
              height={72}
              className="rounded-3xl object-cover shadow-[0_14px_36px_-24px_rgba(24,24,27,0.45)]"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-[72px] items-center justify-center rounded-3xl text-2xl font-black">
              {info.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-2xl font-black tracking-tight">
              {info.name}
            </h2>
            <p className="text-muted-foreground truncate text-sm">
              {info.email}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-hero text-hero-foreground rounded-2xl px-4 py-4">
            <p className="text-hero-muted text-[11px] tracking-[0.2em] uppercase">
              {t("postsLabel")}
            </p>
            <p className="mt-2 text-3xl font-black">{stats.postCount}</p>
          </div>
          <div className="bg-primary/15 text-primary rounded-2xl px-4 py-4">
            <p className="text-[11px] tracking-[0.2em] uppercase opacity-70">
              {t("likesLabel")}
            </p>
            <p className="mt-2 text-3xl font-black">{stats.likeCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[28px] border p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.28em] uppercase">
              {t("workspaceBadge")}
            </p>
            <h3 className="text-foreground mt-2 text-2xl font-black tracking-tight">
              {t("workspaceTitle")}
            </h3>
          </div>
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/posts/new" />}
          >
            <BookOpenText className="size-4" />
            {t("writePost")}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="hover:border-primary/50 hover:bg-primary/5 rounded-2xl border p-4 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground flex items-center gap-2 text-sm font-bold">
                    <Icon className="text-primary size-4" />
                    {item.label}
                  </span>
                  <span className="text-2xl font-black">{item.value}</span>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/gallery/upload" />}>
            <Images className="size-4" />
            {t("continueUpload")}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/collections" />}
          >
            <BookMarked className="size-4" />
            {t("manageCollections")}
          </Button>
        </div>
      </div>
    </section>
  )
}
