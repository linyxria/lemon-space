import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import ResetPasswordForm from "./_components/reset-password-form"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Lemon Space account.",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string }>
}) {
  const [t, { error, token = "" }] = await Promise.all([
    getTranslations("ResetPasswordPage"),
    searchParams,
  ])

  return (
    <section className="bg-card overflow-hidden rounded-lg border p-4 shadow-[0_24px_55px_-35px_rgba(24,24,27,0.35)] sm:p-6 lg:p-8 dark:shadow-[0_24px_55px_-35px_rgba(0,0,0,0.8)]">
      <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 lg:pr-6">
          <p className="border-primary/20 bg-primary/10 text-primary inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
            {t("badge")}
          </p>
          <h1 className="text-foreground max-w-lg text-4xl font-semibold tracking-[-0.04em]">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-7">
            {t("description")}
          </p>
          <div className="text-foreground grid gap-2 text-sm">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              {t("highlight1")}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              {t("highlight2")}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              {t("highlight3")}
            </p>
          </div>
        </div>
        <ResetPasswordForm error={error} token={token} />
      </div>
    </section>
  )
}
