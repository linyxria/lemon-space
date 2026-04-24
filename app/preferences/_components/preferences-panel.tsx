'use client'

import { CheckCheck, Languages, Tags, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { usePreferences } from '@/components/preferences-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PreferencesPanel() {
  const t = useTranslations('Preferences')
  const tCommon = useTranslations('Common')
  const {
    defaultSort,
    locale,
    setDefaultSort,
    setLocale,
    setShowCardTags,
    showCardTags,
  } = usePreferences()

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-zinc-200/70 bg-linear-to-r from-zinc-950 via-zinc-900 to-lime-950/90 px-6 py-6 text-white">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-lime-200/80 uppercase">
          {t('title')}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          {t('description')}
        </p>
      </section>

      <div className="grid gap-4">
        <Card className="rounded-3xl border-zinc-200/80 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900">
              <Languages className="size-4" />
              {t('languageTitle')}
            </CardTitle>
            <p className="text-sm text-zinc-500">{t('languageDesc')}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Button
              variant={locale === 'zh-CN' ? 'default' : 'outline'}
              onClick={() => setLocale('zh-CN')}
            >
              {tCommon('localeZh')}
            </Button>
            <Button
              variant={locale === 'en-US' ? 'default' : 'outline'}
              onClick={() => setLocale('en-US')}
            >
              {tCommon('localeEn')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900">
              <Tags className="size-4" />
              {t('showTagsTitle')}
            </CardTitle>
            <p className="text-sm text-zinc-500">{t('showTagsDesc')}</p>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button
              variant={showCardTags ? 'default' : 'outline'}
              onClick={() => setShowCardTags(true)}
            >
              {tCommon('on')}
            </Button>
            <Button
              variant={!showCardTags ? 'default' : 'outline'}
              onClick={() => setShowCardTags(false)}
            >
              {tCommon('off')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900">
              <TrendingUp className="size-4" />
              {t('sortTitle')}
            </CardTitle>
            <p className="text-sm text-zinc-500">{t('sortDesc')}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Button
              variant={defaultSort === 'latest' ? 'default' : 'outline'}
              onClick={() => setDefaultSort('latest')}
            >
              {tCommon('latest')}
            </Button>
            <Button
              variant={defaultSort === 'popular' ? 'default' : 'outline'}
              onClick={() => setDefaultSort('popular')}
            >
              {tCommon('popular')}
            </Button>
            <Badge variant="secondary" className="ml-auto rounded-full px-3">
              <CheckCheck className="size-3.5" />
              {t('saved')}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
