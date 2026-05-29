"use client"

import { useRouter } from "@bprogress/next/app"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { KeyRound } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import PasswordInput from "@/components/password-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import zUtils from "@/lib/validator"

export default function ResetPasswordForm({
  error,
  token,
}: {
  error?: string
  token: string
}) {
  const t = useTranslations("ResetPassword")
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()
  const formSchema = z
    .object({
      password: zUtils.password(),
      confirmPassword: zUtils.password(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    })
  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const invalidToken = error === "INVALID_TOKEN" || !token

  return (
    <Card className="bg-card/90 dark:bg-card/95 mx-auto w-full max-w-sm gap-8 rounded-[30px] shadow-[0_28px_70px_-40px_rgba(24,24,27,0.45)] backdrop-blur md:max-w-md dark:border-white/10 dark:shadow-[0_28px_70px_-40px_rgba(0,0,0,0.9)]">
      <CardHeader>
        <div className="border-primary/25 bg-primary/10 text-primary mx-auto inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
          <KeyRound className="size-3.5" />
          {t("brand")}
        </div>
        <CardTitle className="text-center text-2xl font-semibold tracking-tight">
          {invalidToken ? t("invalidTitle") : t("title")}
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {invalidToken ? t("invalidDescription") : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10">
        {invalidToken ? (
          <Button
            nativeButton={false}
            render={<Link href="/forgot-password" />}
            className="w-full"
          >
            {t("requestNewLink")}
          </Button>
        ) : (
          <>
            <form
              id="reset-password"
              onSubmit={form.handleSubmit((data) => {
                startTransition(async () => {
                  await authClient.resetPassword(
                    {
                      newPassword: data.password,
                      token,
                    },
                    {
                      onSuccess: () => {
                        toast.success(t("success"))
                        replace("/sign-in")
                      },
                      onError: (ctx) => void toast.error(ctx.error.message),
                    },
                  )
                })
              })}
            >
              <FieldGroup>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-password">
                        {t("passwordLabel")}
                      </FieldLabel>
                      <PasswordInput
                        {...field}
                        id="new-password"
                        autoComplete="new-password"
                        placeholder={t("passwordPlaceholder")}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : (
                        <FieldDescription>{t("passwordHint")}</FieldDescription>
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirm-password">
                        {t("confirmPasswordLabel")}
                      </FieldLabel>
                      <PasswordInput
                        {...field}
                        id="confirm-password"
                        autoComplete="new-password"
                        placeholder={t("confirmPasswordPlaceholder")}
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
            <Field className="mt-8">
              <Button
                type="submit"
                form="reset-password"
                className="w-full"
                disabled={isPending}
              >
                {isPending && <Spinner />}
                {isPending ? t("submitting") : t("submit")}
              </Button>
            </Field>
          </>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-1 text-xs">
        <span className="text-muted-foreground">{t("remembered")}</span>
        <Link href="/sign-in" className="font-semibold">
          {t("backToSignIn")}
        </Link>
      </CardFooter>
    </Card>
  )
}
