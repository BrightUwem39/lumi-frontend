import { describe, expect, it } from 'vitest'
import {
  constantTimeStringMatch,
  constantTimeTokenMatch,
  createOpaqueToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './auth.crypto.js'

describe('authentication cryptography', () => {
  it('hashes and verifies a password without retaining plaintext', async () => {
    const password = 'a long customer passphrase'
    const passwordHash = await hashPassword(password)

    expect(passwordHash).not.toContain(password)
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true)
    await expect(verifyPassword('incorrect password', passwordHash)).resolves.toBe(false)
  })

  it('creates high-entropy opaque tokens and hashes them', () => {
    const token = createOpaqueToken()
    expect(token.length).toBeGreaterThanOrEqual(43)
    expect(hashToken(token)).toHaveLength(64)
    expect(constantTimeTokenMatch(token, hashToken(token))).toBe(true)
    expect(constantTimeTokenMatch(`${token}x`, hashToken(token))).toBe(false)
  })

  it('compares CSRF values without early string comparison', () => {
    expect(constantTimeStringMatch('same-token', 'same-token')).toBe(true)
    expect(constantTimeStringMatch('same-token', 'other-token')).toBe(false)
  })
})
