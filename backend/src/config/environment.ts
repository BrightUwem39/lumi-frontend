import { z } from 'zod'

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true')

const trustProxyFromEnvironment = z.union([
  z.literal('true').transform(() => true),
  z.literal('false').transform(() => false),
  z.coerce.number().int().min(0),
])

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    API_DOCS_ENABLED: booleanFromString,
    AUTH_DEV_TOKENS_ENABLED: booleanFromString,
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(5).max(10_080).default(1440),
    RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    TRUST_PROXY: trustProxyFromEnvironment.default(false),
    CORS_ORIGINS: z.string().min(1),
    COOKIE_SECRET: z.string().min(32),
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    REDIS_URL: z.string().url().startsWith('redis://'),
  })
  .superRefine((environment, context) => {
    const origins = environment.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    if (origins.some((origin) => origin === '*')) {
      context.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'Wildcard CORS is forbidden because Lumi sends credentials.',
      })
    }

    if (
      environment.NODE_ENV === 'production' &&
      environment.COOKIE_SECRET.includes('replace-with')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['COOKIE_SECRET'],
        message: 'The placeholder cookie secret cannot be used in production.',
      })
    }

    if (environment.NODE_ENV === 'production' && environment.AUTH_DEV_TOKENS_ENABLED) {
      context.addIssue({
        code: 'custom',
        path: ['AUTH_DEV_TOKENS_ENABLED'],
        message: 'Development authentication tokens are forbidden in production.',
      })
    }
  })

export type Environment = z.infer<typeof environmentSchema>

// Nest calls this before creating modules so invalid or unsafe settings fail fast.
export function validateEnvironment(input: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(input)
  if (result.success) return result.data

  const details = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid server environment: ${details}`)
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function parseTrustProxy(value: string | number): boolean | number {
  if (typeof value === 'number') return value
  return value === 'true'
}
