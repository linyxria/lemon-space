"use client"

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { MailCheck } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

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
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import zUtils from "@/lib/validator"

const formSchema = z.object({
  email: zUtils.email(),
})

export default function ForgotPasswordForm() {
  const t = useTranslations("ForgotPassword")
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  return (
    <Card className="bg-card/90 dark:bg-card/95 mx-auto w-full max-w-sm gap-8 rounded-[30px] shadow-[0_28px_70px_-40px_rgba(24,24,27,0.45)] backdrop-blur md:max-w-md dark:border-white/10 dark:shadow-[0_28px_70px_-40px_rgba(0,0,0,0.9)]">
      <CardHeader>
        <div className="border-primary/25 bg-primary/10 text-primary mx-auto inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
          <MailCheck className="size-3.5" />
          {t("brand")}
        </div>
        <CardTitle className="text-center text-2xl font-semibold tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-center text-sm">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10">
        <form
          id="forgot-password"
          onSubmit={form.handleSubmit((data) => {
            startTransition(async () => {
              await authClient.requestPasswordReset(
                {
                  email: data.email,
                  redirectTo: "/reset-password",
                },
                {
                  onSuccess: () => {
                    setSentEmail(data.email)
                    toast.success(t("sentToast"))
                  },
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
                  <FieldLabel htmlFor="reset-email">
                    {t("emailLabel")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>{t("emailHint")}</FieldDescription>
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          {sentEmail ? (
            <p className="border-primary/20 bg-primary/10 text-foreground mt-5 rounded-3xl border px-4 py-3 text-sm leading-6">
              {t("sentInline", { email: sentEmail })}
            </p>
          ) : null}
        </form>
        <Field className="mt-8">
          <Button
            type="submit"
            form="forgot-password"
            className="w-full"
            disabled={isPending}
          >
            {isPending && <Spinner />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </Field>
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
