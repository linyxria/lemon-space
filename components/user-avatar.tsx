'use client'

import type { ComponentProps } from 'react'
import { useState } from 'react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarProps,
} from './ui/avatar'

export default function UserAvatar({
  name,
  image,
  imageProps,
  ...props
}: AvatarProps & {
  name: string
  image: string | null | undefined
  imageProps?: ComponentProps<typeof AvatarImage>
}) {
  const src = image ?? '/user.png'
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  return (
    <Avatar key={src} {...props}>
      <AvatarImage
        src={src}
        alt={name}
        onLoadingStatusChange={setImageStatus}
        {...imageProps}
      />
      <AvatarFallback className={imageStatus === 'error' ? undefined : 'hidden'}>
        {name.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}
