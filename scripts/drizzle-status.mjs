import dotenv from 'dotenv'
import postgres from 'postgres'

const envFiles =
  process.env.NODE_ENV === 'production'
    ? ['.env.production', '.env']
    : ['.env.development', '.env']

for (const file of envFiles) {
  dotenv.config({ path: file, override: false })
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const url = new URL(databaseUrl)
console.log(
  `Connecting to ${url.username}@${url.hostname}:${url.port || '(default)'}/${url.pathname.slice(1)}`,
)

const client = postgres(databaseUrl, { prepare: false, max: 1 })

try {
  const migrations = await client`
    select id, hash, created_at
    from drizzle.__drizzle_migrations
    order by created_at
  `.catch((error) => {
    if (error.code === '42P01' || error.code === '3F000') return []
    throw error
  })

  const tables = await client`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `

  console.log(`Migration records: ${migrations.length}`)
  for (const migration of migrations) {
    console.log(`- ${migration.created_at} ${migration.hash.slice(0, 12)}`)
  }
  console.log(
    `Public tables: ${tables.map((row) => row.table_name).join(', ')}`,
  )
} finally {
  await client.end()
}
