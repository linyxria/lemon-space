'use client'

import {
  CheckCheck,
  Languages,
  Monitor,
  Moon,
  Sun,
  Tags,
  TrendingUp,
} from 'lucide-react'
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
    setTheme,
    showCardTags,
    theme,
  } = usePreferences()

  return (
    <div className="space-y-5">
      <section className="from-hero via-hero to-primary/35 text-hero-foreground rounded-[28px] border bg-linear-to-r px-6 py-6">
        <p className="text-primary text-[11px] font-semibold tracking-[0.28em] uppercase">
          {t('title')}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-hero-muted mt-2 max-w-2xl text-sm">
          {t('description')}
        </p>
      </section>

      <div className="grid gap-4">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="size-4" />
              {t('languageTitle')}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t('languageDesc')}</p>
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

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="size-4" />
              {t('themeTitle')}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t('themeDesc')}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
            >
              <Monitor className="size-4" />
              {tCommon('themeSystem')}
            </Button>
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              <Sun className="size-4" />
              {tCommon('themeLight')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              <Moon className="size-4" />
              {tCommon('themeDark')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="size-4" />
              {t('showTagsTitle')}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t('showTagsDesc')}</p>
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

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              {t('sortTitle')}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t('sortDesc')}</p>
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
