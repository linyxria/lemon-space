'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { type MouseEventHandler, type ReactNode, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'

import { Field } from './ui/field'
import { Spinner } from './ui/spinner'

function SocialButton({
  title,
  image,
  isLoading,
  onClick,
}: {
  title: string
  image: string
  isLoading: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <Button
      className="flex items-center gap-4"
      variant="outline"
      disabled={isLoading}
      onClick={onClick}
    >
      <div className="flex w-14 justify-end">
        {isLoading ? (
          <Spinner className="size-4" />
        ) : (
          <Image src={image} alt="Github" width={16} height={16} />
        )}
      </div>
      <span className="flex-1 text-left">{title}</span>
    </Button>
  )
}

type Provider = 'github' | 'google' | 'wechat' | 'apple'

export default function AuthCard({
  title,
  description,
  sub,
  button,
  form,
}: {
  title: string
  description: string
  sub: {
    description: string
    to: string
    action: string
  }
  button: {
    text: string
    form: string
    loading: boolean
  }
  form: ReactNode
}) {
  const searchParams = useSearchParams()

  const [providing, setProviding] = useState<Provider>()

  const handleSocialSignIn = async (provider: Provider) => {
    setProviding(provider)
    await authClient.signIn.social(
      {
        provider,
        callbackURL: searchParams.get('callbackURL') || '/', // 登录成功后的跳转地址
      },
      {
        onError: (ctx) => void toast.error(ctx.error.message),
        onResponse: () => setProviding(undefined),
      },
    )
  }

  return (
    <Card className="mx-auto max-w-xs gap-8 shadow-lg md:max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-10">
        {/* 社交登录按钮 */}
        <div className="grid grid-cols-2 gap-2">
          <SocialButton
            title="Github"
            image="/github.svg"
            isLoading={providing === 'github'}
            onClick={() => handleSocialSignIn('github')}
          />
          <SocialButton
            title="Google"
            image="/google.svg"
            isLoading={providing === 'google'}
            onClick={() => handleSocialSignIn('google')}
          />
          {/* <SocialButton
            title="Apple"
            image="/apple.svg"
            isLoading={providing === 'apple'}
            onClick={() => handleSocialSignIn('apple')}
          />
          <SocialButton
            title="微信"
            image="/wechat.svg"
            isLoading={providing === 'wechat'}
            onClick={() => handleSocialSignIn('wechat')}
          /> */}
        </div>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-4">
              或者
            </span>
          </div>
        </div>
        {form}
        <Field className="mt-8">
          <Button
            type="submit"
            form={button.form}
            className="w-full"
            disabled={button.loading}
          >
            {button.loading && <Spinner />}
            {button.text}
          </Button>
        </Field>
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-1 text-xs">
        <span className="text-muted-foreground">{sub.description}</span>
        <Link href={sub.to}>{sub.action}</Link>
        {/* 点击继续即表示你同意我们的服务协议和隐私政策。 */}
      </CardFooter>
    </Card>
  )
}
