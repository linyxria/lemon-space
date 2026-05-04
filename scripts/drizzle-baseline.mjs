import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import dotenv from "dotenv"
import postgres from "postgres"

const envFiles =
  process.env.NODE_ENV === "production"
    ? [".env.production", ".env"]
    : [".env.development", ".env"]

for (const file of envFiles) {
  dotenv.config({ path: file, override: false })
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL is required.")
  process.exit(1)
}

const args = process.argv.slice(2)
const tagArg = args.find((arg) => arg.startsWith("--tag="))
const targetTag = tagArg?.slice("--tag=".length)
const migrationsDir = path.resolve("drizzle")
const journalPath = path.join(migrationsDir, "meta", "_journal.json")
const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"))
const entries = journal.entries

if (!entries.length) {
  console.error("No migrations found in drizzle/meta/_journal.json.")
  process.exit(1)
}

const targetEntry = targetTag
  ? entries.find((entry) => entry.tag === targetTag)
  : entries.at(-1)

if (!targetEntry) {
  console.error(`Migration tag not found: ${targetTag}`)
  process.exit(1)
}

const baselineEntries = entries.filter((entry) => entry.idx <= targetEntry.idx)
const client = postgres(databaseUrl, { prepare: false, max: 1 })

function getMigrationHash(entry) {
  const migrationSqlPath = path.join(migrationsDir, `${entry.tag}.sql`)
  const migrationSql = fs.readFileSync(migrationSqlPath, "utf8")
  return crypto.createHash("sha256").update(migrationSql).digest("hex")
}

try {
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `
  await client`
    DELETE FROM drizzle.__drizzle_migrations
    WHERE created_at >= ${baselineEntries[0].when}
  `
  for (const entry of baselineEntries) {
    await client`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${getMigrationHash(entry)}, ${entry.when})
    `
  }

  console.log(
    `Drizzle baseline reset through ${targetEntry.tag} (${targetEntry.when}).`,
  )
} finally {
  await client.end()
}
