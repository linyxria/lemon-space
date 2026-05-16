"use client"

import { useRouter } from "@bprogress/next/app"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import AuthCard from "@/components/auth-card"
import PasswordInput from "@/components/password-input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import zUtils from "@/lib/validator"

const formSchema = z.object({
  username: zUtils.username(),
  email: zUtils.email(),
  password: zUtils.password(),
})

export default function SignUpForm({ callbackURL }: { callbackURL: string }) {
  const t = useTranslations("SignUp")
  const { refresh, replace } = useRouter()
  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  })
  const [isPending, startTransition] = useTransition()

  return (
    <AuthCard
      title={t("title")}
      description={t("description")}
      sub={{
        description: t("hasAccount"),
        to: "/sign-in",
        action: t("signIn"),
      }}
      callbackURL={callbackURL}
      button={{
        text: t("submit"),
        form: "sign-up",
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
                    // if (requireEmailVerification) {
                    //   toast.success(t('checkInbox', { email: data.email }))
                    //   const next = new URLSearchParams({
                    //     email: data.email,
                    //     callbackURL,
                    //   })
                    //   router.push(`/sign-in?${next.toString()}`)
                    //   return
                    // }

                    toast.success(t("welcome"))
                    replace(callbackURL)
                    refresh()
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
                  <FieldLabel htmlFor="username">
                    {t("usernameLabel")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="username"
                    placeholder={t("usernamePlaceholder")}
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
                  <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    placeholder={t("emailPlaceholder")}
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
                  <FieldLabel htmlFor="password">
                    {t("passwordLabel")}
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="password"
                    placeholder={t("passwordPlaceholder")}
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
