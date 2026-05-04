'use client'

import { useTranslations } from 'next-intl'

import TagInput from '@/components/tag-input'
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export interface MetadataValues {
  title: string
  tags: string[]
}

export default function MetadataForm({
  formValues,
  onChange,
}: {
  formValues: MetadataValues
  onChange: (values: MetadataValues) => void
}) {
  const t = useTranslations('MetadataForm')

  return (
    <FieldSet className="bg-muted rounded-lg p-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">{t('titleLabel')}</FieldLabel>
          <Input
            type="text"
            id="title"
            placeholder={t('titlePlaceholder')}
            value={formValues.title}
            onChange={(e) => onChange({ ...formValues, title: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="tags">{t('tagsLabel')}</FieldLabel>
          <TagInput
            type="text"
            id="tags"
            placeholder={t('tagsPlaceholder')}
            value={formValues.tags}
            onChange={(tags) => onChange({ ...formValues, tags })}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
