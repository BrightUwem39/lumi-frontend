import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { describe, expect, it, vi } from 'vitest'
import { UserRole } from '../../generated/prisma/client.js'
import { RolesGuard } from './roles.guard.js'

function contextFor(role?: (typeof UserRole)[keyof typeof UserRole]) {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => role ? { authentication: { user: { role } } } : {},
    }),
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  it('allows an administrator through an administrator-only route', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMINISTRATOR]),
    } as unknown as Reflector
    expect(new RolesGuard(reflector).canActivate(contextFor(UserRole.ADMINISTRATOR))).toBe(true)
  })

  it('denies customers and unauthenticated requests on administrator routes', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.ADMINISTRATOR]),
    } as unknown as Reflector
    const guard = new RolesGuard(reflector)
    expect(guard.canActivate(contextFor(UserRole.CUSTOMER))).toBe(false)
    expect(guard.canActivate(contextFor())).toBe(false)
  })
})
