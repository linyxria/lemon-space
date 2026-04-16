'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import AuthScreen from '@/components/auth-screen'
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

export default function SignUpPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })

  const [isPending, startTransition] = useTransition()

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      await authClient.signUp.email(
        {
          name: data.username,
          email: data.email,
          password: data.password,
          callbackURL: '/',
        },
        {
          onSuccess: () => void toast.success('注册成功！正在跳转...'),
          onError: (ctx) => void toast.error(ctx.error.message),
        },
      )
    })
  }

  return (
    <AuthScreen
      title="创建您的账户"
      description="继续使用 Lemon Gallery"
      sub={{ description: '已经有账户了？', to: '/sign-in', action: '登录' }}
      button={{
        text: '创建账号',
        form: 'sign-up',
        loading: isPending,
      }}
      form={
        <form id="sign-up" onSubmit={form.handleSubmit(onSubmit)}>
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
