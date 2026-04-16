declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string

    R2_ENDPOINT: string
    R2_ACCESS_KEY_ID: string
    R2_SECRET_ACCESS_KEY: string
    R2_BUCKET_NAME: string
    R2_PUBLIC_DOMAIN: string

    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
    CLERK_SECRET_KEY: string
  }
}
