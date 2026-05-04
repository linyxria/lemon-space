"use client"

import dynamic from "next/dynamic"

import UserNavSkeleton from "./user-nav-skeleton"

const UserNavClient = dynamic(() => import("./user-nav-client"), {
  ssr: false,
  loading: UserNavSkeleton,
})

export default function UserNav() {
  return <UserNavClient />
}
