"use client"

import { useRouter } from "@bprogress/next/app"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import AuthCard from "@/components/auth-card"
import PasswordInput from "@/components/password-input"
import { Button } from "@/components/ui/button"
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
  email: zUtils.email(),
  password: zUtils.password(),
})

export default function SignInForm() {
  const t = useTranslations("SignIn")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null)

  const callbackURL = searchParams.get("callbackURL") || "/"
  const emailFromQuery = searchParams.get("email") ?? ""

  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      email: emailFromQuery,
      password: "",
    },
  })
  const [isPending, startTransition] = useTransition()

  return (
    <AuthCard
      title={t("title")}
      description={t("description")}
      sub={{
        description: t("noAccount"),
        to: "/sign-up",
        action: t("register"),
      }}
      button={{
        text: t("submit"),
        form: "sign-in",
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
                  callbackURL,
                },
                {
                  onSuccess: () => {
                    setPendingVerificationEmail(null)
                    toast.success(t("welcome"))
                    router.replace(callbackURL)
                    router.refresh()
                  },
                  onError: (ctx) => {
                    if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
                      setPendingVerificationEmail(data.email)
                      toast.error(t("emailNotVerified"))
                      return
                    }
                    toast.error(ctx.error.message)
                  },
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
          {pendingVerificationEmail ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                {t("verificationHint", { email: pendingVerificationEmail })}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={resending}
                onClick={async () => {
                  try {
                    setResending(true)
                    await authClient.sendVerificationEmail({
                      email: pendingVerificationEmail,
                      callbackURL,
                    })
                    toast.success(t("verificationResent"))
                  } catch (error) {
                    console.error(error)
                    toast.error(t("verificationResendFailed"))
                  } finally {
                    setResending(false)
                  }
                }}
              >
                {resending ? t("resending") : t("resendVerification")}
              </Button>
            </div>
          ) : null}
        </form>
      }
    />
  )
}
