declare module 'cloudflare:workers' {
  interface CloudflareEnv {
    DB: D1Database
    R2: R2Bucket
    APP_PASSWORD: string
    APP_SECRET: string
    OPENAI_API_KEY: string
  }
  const env: CloudflareEnv
  export { env }
}
