import Image from 'next/image'
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
  ...props
}: AvatarProps & {
  name: string
  image: string | null | undefined
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const resolvedImage = image && image !== failedImageUrl ? image : '/user.png'

  return (
    <Avatar {...props}>
      <AvatarImage
        src={resolvedImage}
        alt={name}
        onError={() => setFailedImageUrl(image ?? '/user.png')}
      />
      <AvatarFallback>
        <div className="relative size-full">
          <Image
            src="/user.png"
            alt={name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      </AvatarFallback>
    </Avatar>
  )
}
