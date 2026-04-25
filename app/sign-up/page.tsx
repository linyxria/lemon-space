import { CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import SignUpForm from './_components/sign-up-form'

export default async function SignUpPage() {
  const t = await getTranslations('SignUpPage')

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-zinc-200/80 bg-linear-to-br from-white via-zinc-50 to-amber-50/70 p-4 shadow-[0_24px_55px_-35px_rgba(24,24,27,0.35)] dark:border-white/10 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/35 dark:shadow-[0_24px_55px_-35px_rgba(0,0,0,0.8)] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-amber-100/70 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-64 rounded-full bg-lime-100/50 blur-3xl dark:bg-lime-500/10" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 lg:pr-6">
          <p className="inline-flex rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-800 uppercase dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
            {t('badge')}
          </p>
          <h1 className="max-w-lg text-4xl font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">
            {t('title')}
          </h1>
          <p className="max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {t('description')}
          </p>
          <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-300" />
              {t('highlight1')}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-300" />
              {t('highlight2')}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-300" />
              {t('highlight3')}
            </p>
          </div>
        </div>
        <SignUpForm />
      </div>
    </section>
  )
}
