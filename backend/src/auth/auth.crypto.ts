import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { argon2id, hash, verify } from 'argon2'

const PASSWORD_HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const

let dummyPasswordHash: Promise<string> | undefined

// Argon2id deliberately makes offline password guessing expensive.
export function hashPassword(password: string) {
  return hash(password, PASSWORD_HASH_OPTIONS)
}

export async function verifyPassword(password: string, passwordHash: string) {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}

// Missing users still perform an Argon2 operation to reduce email enumeration by timing.
export async function verifyAgainstDummyPassword(password: string) {
  dummyPasswordHash ??= hashPassword('lumi-dummy-password-never-used-for-login')
  return verifyPassword(password, await dummyPasswordHash)
}

export function createOpaqueToken() {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function hashPrivateIdentifier(value: string, secret: string) {
  return createHmac('sha256', secret).update(value, 'utf8').digest('hex')
}

export function constantTimeTokenMatch(token: string, expectedHash: string) {
  const actual = Buffer.from(hashToken(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function constantTimeStringMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8')
  const rightBuffer = Buffer.from(right, 'utf8')
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}
