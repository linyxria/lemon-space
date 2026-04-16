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
  return (
    <FieldSet className="bg-muted rounded-lg p-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">设置标题（可选）</FieldLabel>
          <Input
            type="text"
            id="title"
            placeholder="如果不填写，将使用原文件名"
            value={formValues.title}
            onChange={(e) => onChange({ ...formValues, title: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="tags">添加标签（回车确认）</FieldLabel>
          <TagInput
            type="text"
            id="tags"
            placeholder="例如：UI设计、极简 Mobile..."
            value={formValues.tags}
            onChange={(tags) => onChange({ ...formValues, tags })}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
