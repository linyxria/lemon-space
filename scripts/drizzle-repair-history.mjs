import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

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

const migrationsDir = path.resolve('drizzle')
const journalPath = path.join(migrationsDir, 'meta', '_journal.json')
const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'))
const entries = journal.entries

if (!entries.length) {
  console.error('No migrations found in drizzle/meta/_journal.json.')
  process.exit(1)
}

function getMigrationHash(entry) {
  const migrationSqlPath = path.join(migrationsDir, `${entry.tag}.sql`)
  const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8')
  return crypto.createHash('sha256').update(migrationSql).digest('hex')
}

const client = postgres(databaseUrl, { prepare: false, max: 1 })

try {
  await client.begin(async (tx) => {
    await tx`CREATE SCHEMA IF NOT EXISTS drizzle`
    await tx`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `
    await tx`TRUNCATE drizzle.__drizzle_migrations RESTART IDENTITY`

    for (const entry of entries) {
      await tx`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${getMigrationHash(entry)}, ${entry.when})
      `
    }
  })

  const latest = entries.at(-1)
  console.log(
    `Drizzle migration history repaired through ${latest.tag} (${latest.when}).`,
  )
} finally {
  await client.end()
}
