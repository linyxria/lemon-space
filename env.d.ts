declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string

    R2_ENDPOINT: string
    R2_ACCESS_KEY_ID: string
    R2_SECRET_ACCESS_KEY: string
    R2_BUCKET_NAME: string
    R2_PUBLIC_DOMAIN: string

    BETTER_AUTH_SECRET: string
    BETTER_AUTH_URL: string

    GITHUB_CLIENT_ID: string
    GITHUB_CLIENT_SECRET: string

    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string

    RESEND_API_KEY?: string
    AUTH_EMAIL_FROM?: string
    AUTH_EMAIL_REPLY_TO?: string
    AUTH_REQUIRE_EMAIL_VERIFICATION?: string
  }
}
