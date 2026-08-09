import { describe, expect, it } from 'vitest'
import { validateEnvironment } from './environment.js'

const validEnvironment = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: '3000',
  API_DOCS_ENABLED: 'false',
  AUTH_DEV_TOKENS_ENABLED: 'false',
  LOG_LEVEL: 'silent',
  TRUST_PROXY: 'false',
  CORS_ORIGINS: 'http://127.0.0.1:5173',
  COOKIE_SECRET: 'test-only-cookie-secret-with-32-characters',
  DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/lumi_test',
  REDIS_URL: 'redis://127.0.0.1:6379',
}

describe('validateEnvironment', () => {
  it('parses valid settings', () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      PORT: 3000,
      API_DOCS_ENABLED: false,
      TRUST_PROXY: false,
    })
  })

  it('rejects wildcard credentialed CORS', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, CORS_ORIGINS: '*' }),
    ).toThrow('Wildcard CORS is forbidden')
  })

  it('rejects short cookie secrets', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, COOKIE_SECRET: 'short' }),
    ).toThrow('COOKIE_SECRET')
  })

  it('rejects development authentication tokens in production', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
        AUTH_DEV_TOKENS_ENABLED: 'true',
      }),
    ).toThrow('Development authentication tokens are forbidden')
  })
})
