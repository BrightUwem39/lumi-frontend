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
    REDIS_URL: z.string().url().refine(
      (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
      'Redis URL must use redis:// or rediss://.',
    ),
    PAYSTACK_ENABLED: booleanFromString,
    PAYSTACK_MODE: z.enum(['test', 'live']).default('test'),
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_CALLBACK_URL: z.string().url().optional(),
    PAYSTACK_ALLOWED_CURRENCIES: z.string().regex(/^[A-Z]{3}(,[A-Z]{3})*$/).default('NGN'),
    PAYMENT_RECONCILIATION_INTERVAL_SECONDS: z.coerce.number().int().min(15).max(3600).default(60),
    PAYMENT_RECONCILIATION_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
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

    if (environment.NODE_ENV === 'production' && /replace|change|example|placeholder/i.test(environment.COOKIE_SECRET)) {
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

    if (environment.NODE_ENV === 'production') {
      for (const origin of origins) {
        try {
          const parsed = new URL(origin)
          if (parsed.protocol !== 'https:' || parsed.origin !== origin || isLocalHost(parsed.hostname)) {
            throw new Error()
          }
        } catch {
          context.addIssue({
            code: 'custom',
            path: ['CORS_ORIGINS'],
            message: 'Production CORS origins must be exact public HTTPS origins.',
          })
          break
        }
      }
      if (environment.TRUST_PROXY === false || environment.TRUST_PROXY === 0) {
        context.addIssue({
          code: 'custom',
          path: ['TRUST_PROXY'],
          message: 'Production must trust the known reverse-proxy hop.',
        })
      }
      if (environment.API_DOCS_ENABLED) {
        context.addIssue({
          code: 'custom',
          path: ['API_DOCS_ENABLED'],
          message: 'API documentation must be disabled in production.',
        })
      }
      for (const key of ['DATABASE_URL', 'REDIS_URL'] as const) {
        if (isLocalHost(new URL(environment[key]).hostname)) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} cannot point to localhost in production.`,
          })
        }
      }
    }

    if (environment.PAYSTACK_ENABLED) {
      const requiredPrefix = environment.PAYSTACK_MODE === 'live' ? 'sk_live_' : 'sk_test_'
      if (!environment.PAYSTACK_SECRET_KEY?.startsWith(requiredPrefix)) {
        context.addIssue({
          code: 'custom',
          path: ['PAYSTACK_SECRET_KEY'],
          message: `A ${environment.PAYSTACK_MODE} server-side Paystack secret key is required when payments are enabled.`,
        })
      }
      if (!environment.PAYSTACK_CALLBACK_URL) {
        context.addIssue({
          code: 'custom',
          path: ['PAYSTACK_CALLBACK_URL'],
          message: 'A Paystack callback URL is required when payments are enabled.',
        })
      }
      if (
        environment.NODE_ENV === 'production' &&
        environment.PAYSTACK_CALLBACK_URL &&
        (new URL(environment.PAYSTACK_CALLBACK_URL).protocol !== 'https:' ||
          isLocalHost(new URL(environment.PAYSTACK_CALLBACK_URL).hostname))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['PAYSTACK_CALLBACK_URL'],
          message: 'Production Paystack callback URL must use public HTTPS.',
        })
      }
    }
  })

export type Environment = z.infer<typeof environmentSchema>

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

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
