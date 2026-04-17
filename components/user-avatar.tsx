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
  return (
    <Avatar {...props}>
      <AvatarImage src={image ?? '/user.png'} alt={name} />
      <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
    </Avatar>
  )
}
