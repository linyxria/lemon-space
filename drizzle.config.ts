import dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

const envFiles =
  process.env.NODE_ENV === "production"
    ? [".env.production", ".env"]
    : [".env.development", ".env"]

for (const path of envFiles) {
  dotenv.config({ path, override: false })
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
