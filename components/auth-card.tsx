'use client'

import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
      <div className="flex w-10 justify-end md:w-14">
        {isLoading ? (
          <Spinner className="size-4" />
        ) : (
          <Image src={image} alt={title} width={16} height={16} />
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
  const t = useTranslations('AuthCard')
  const searchParams = useSearchParams()

  const [providing, setProviding] = useState<Provider>()

  const handleSocialSignIn = async (provider: Provider) => {
    setProviding(provider)
    await authClient.signIn.social(
      {
        provider,
        callbackURL: searchParams.get('callbackURL') || '/',
      },
      {
        onError: (ctx) => void toast.error(ctx.error.message),
        onResponse: () => setProviding(undefined),
      },
    )
  }

  return (
    <Card className="bg-card/90 mx-auto w-full max-w-sm gap-8 rounded-[30px] shadow-[0_28px_70px_-40px_rgba(24,24,27,0.45)] backdrop-blur md:max-w-md">
      <CardHeader>
        <div className="border-primary/25 bg-primary/10 text-primary mx-auto inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
          <Sparkles className="size-3.5" />
          {t('brand')}
        </div>
        <CardTitle className="text-center text-2xl font-black tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10">
        <div className="grid grid-cols-2 gap-2">
          <SocialButton
            title={t('github')}
            image="/github.svg"
            isLoading={providing === 'github'}
            onClick={() => handleSocialSignIn('github')}
          />
          <SocialButton
            title={t('google')}
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
              {t('or')}
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
        <Link href={sub.to} className="font-semibold">
          {sub.action}
        </Link>
      </CardFooter>
    </Card>
  )
}
