'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useSearchParams } from 'next/navigation'
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
  email: zUtils.email(),
  password: zUtils.password(),
})

export default function SignInForm() {
  const searchParams = useSearchParams()
  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const [isPending, startTransition] = useTransition()

  return (
    <AuthCard
      title="登录 Lemon Gallery"
      description="欢迎回来！请登录您的账户以继续。"
      sub={{ description: '还没有账户？', to: '/sign-up', action: '注册' }}
      button={{
        text: '登录',
        form: 'sign-in',
        loading: isPending,
      }}
      form={
        <form
          id="sign-in"
          onSubmit={form.handleSubmit((data) => {
            startTransition(async () => {
              await authClient.signIn.email(
                {
                  email: data.email,
                  password: data.password,
                  callbackURL: searchParams.get('callbackURL') || '/',
                },
                {
                  onSuccess: () => void toast.success('欢迎回来！'),
                  onError: (ctx) => void toast.error(ctx.error.message),
                },
              )
            })
          })}
        >
          <FieldGroup>
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
