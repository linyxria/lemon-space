import { UserIcon } from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarProps,
} from './ui/avatar'

export default function UserAvatar({
  image,
  alt,
  ...props
}: AvatarProps & {
  image: string | null | undefined
  alt: string
}) {
  return (
    <Avatar {...props}>
      <AvatarImage src={image ?? undefined} alt={alt} />
      <AvatarFallback className="bg-linear-to-br from-[#406aff] to-[#a855f7] text-white">
        <UserIcon />
      </AvatarFallback>
    </Avatar>
  )
}
