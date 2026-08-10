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

const validProductionEnvironment = {
  ...validEnvironment,
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  API_DOCS_ENABLED: 'false',
  TRUST_PROXY: '1',
  CORS_ORIGINS: 'https://shop.example.com',
  COOKIE_SECRET: 'a-production-secret-with-more-than-32-characters',
  DATABASE_URL: 'postgresql://user:password@database.example.com:5432/lumi?sslmode=require',
  REDIS_URL: 'rediss://default:password@redis.example.com:6379',
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

  it('requires server-side provider settings when Paystack is enabled', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, PAYSTACK_ENABLED: 'true' }),
    ).toThrow('PAYSTACK_SECRET_KEY')
  })

  it('accepts hardened production settings', () => {
    expect(validateEnvironment(validProductionEnvironment)).toMatchObject({
      NODE_ENV: 'production', TRUST_PROXY: 1, PAYSTACK_MODE: 'test',
    })
  })

  it('rejects localhost and HTTP origins in production', () => {
    expect(() => validateEnvironment({
      ...validProductionEnvironment,
      CORS_ORIGINS: 'http://localhost:5173',
    })).toThrow('public HTTPS origins')
  })

  it('requires a Paystack key matching the selected mode', () => {
    expect(() => validateEnvironment({
      ...validProductionEnvironment,
      PAYSTACK_ENABLED: 'true',
      PAYSTACK_MODE: 'live',
      PAYSTACK_SECRET_KEY: 'sk_test_not-a-live-key',
      PAYSTACK_CALLBACK_URL: 'https://shop.example.com/payment-return',
    })).toThrow('live server-side Paystack secret key')
  })
})
