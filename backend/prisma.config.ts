import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 keeps environment-specific connection details outside the schema.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
