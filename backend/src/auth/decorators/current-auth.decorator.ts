import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from '../guards/session.guard.js'

export const CurrentAuthentication = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().authentication,
)
