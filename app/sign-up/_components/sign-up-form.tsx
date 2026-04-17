'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import AuthCard from '@/components/auth-card'
import PasswordInput from '@/components/password-input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import zUtils from '@/lib/validator'

const formSchema = z.object({
  username: zUtils.username(),
  email: zUtils.email(),
  password: zUtils.password(),
})

export default function SignUpForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })
  const [isPending, startTransition] = useTransition()

  const callbackURL = searchParams.get('callbackURL') || '/'

  return (
    <AuthCard
      title="创建您的账户"
      description="继续使用 Lemon Gallery"
      sub={{ description: '已经有账户了？', to: '/sign-in', action: '登录' }}
      button={{
        text: '创建账号',
        form: 'sign-up',
        loading: isPending,
      }}
      form={
        <form
          id="sign-up"
          onSubmit={form.handleSubmit((data) => {
            startTransition(async () => {
              await authClient.signUp.email(
                {
                  name: data.username,
                  email: data.email,
                  password: data.password,
                  callbackURL,
                },
                {
                  onSuccess: () => {
                    toast.success('注册成功！正在跳转...')
                    router.push(callbackURL)
                  },
                  onError: (ctx) => void toast.error(ctx.error.message),
                },
              )
            })
          })}
        >
          <FieldGroup>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="username">用户名</FieldLabel>
                  <Input
                    {...field}
                    id="username"
                    placeholder="请输入您的用户名"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">电子邮件地址</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    placeholder="请输入您的电子邮件地址"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="password"
                    placeholder="请输入您的密码"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      }
    />
  )
}
