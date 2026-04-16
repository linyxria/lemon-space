'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Field } from './ui/field'
import { Spinner } from './ui/spinner'

// TODO 未处理
const isLoading = false

export default function AuthScreen({
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
  // 1. 处理社交登录 (GitHub)
  // const handleSocialSignIn = async (provider: 'github' | 'google') => {
  //   setIsLoading(true)
  //   await authClient.signIn.social(
  //     {
  //       provider,
  //       callbackURL: '/dashboard',
  //     },
  //     {
  //       onError: (ctx) => void toast.error(ctx.error.message),
  //       onResponse: () => setIsLoading(false),
  //     },
  //   )
  // }

  return (
    <Card className="mx-auto max-w-xs gap-8 shadow-lg md:max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-10">
        {/* 社交登录按钮 */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            // onClick={() => handleSocialSignIn('github')}
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'Github'}
          </Button>
          <Button
            variant="outline"
            // onClick={() => handleSocialSignIn('google')}
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'Google'}
          </Button>
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
