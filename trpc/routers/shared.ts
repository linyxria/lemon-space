import { sql } from 'drizzle-orm'

import { like, tag } from '@/db/schema'
import { objectKey2Url } from '@/lib/utils'

export function createDistinctLikeUserCountExpr() {
  return sql<number>`count(distinct ${like.userId})`.mapWith(Number)
}

export function createTagNamesAggExpr() {
  return sql<string[]>`coalesce(
    json_agg(distinct ${tag.name}) filter (where ${tag.name} is not null),
    '[]'
  )`.as('tags')
}

export function mapObjectKeyToUrl<T extends { objectKey: string }>(value: T) {
  const { objectKey, ...rest } = value
  return {
    ...rest,
    url: objectKey2Url(objectKey),
  }
}

export function mapUserImageToUrl<T extends { image: string | null }>(value: T) {
  const { image, ...rest } = value
  return {
    ...rest,
    image: image ? objectKey2Url(image) : null,
  }
}
