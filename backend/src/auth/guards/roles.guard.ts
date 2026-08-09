import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { UserRole } from '../../generated/prisma/enums.js'
import { REQUIRED_ROLES_KEY } from '../decorators/roles.decorator.js'
import type { AuthenticatedRequest } from './session.guard.js'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<UserRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!required?.length) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    return Boolean(
      request.authentication && required.includes(request.authentication.user.role),
    )
  }
}
