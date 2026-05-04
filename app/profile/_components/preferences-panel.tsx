'use client'

import { CheckCheck, Languages, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { usePreferences } from '@/components/preferences-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PreferencesPanel() {
  const t = useTranslations('Preferences')
  const tCommon = useTranslations('Common')
  const { locale, setLocale, setTheme, theme } = usePreferences()

  return (
    <section className="space-y-5">
      <div>
        <p className="text-primary text-[11px] font-semibold tracking-[0.28em] uppercase">
          {t('title')}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">
          {t('title')}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t('description')}
        </p>
      </div>

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

        <Badge variant="secondary" className="ml-auto w-fit rounded-full px-3">
          <CheckCheck className="size-3.5" />
          {t('saved')}
        </Badge>
      </div>
    </section>
  )
}
