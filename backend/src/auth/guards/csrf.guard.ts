import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { AuthCookies } from '../auth.cookies.js'
import { constantTimeStringMatch, constantTimeTokenMatch } from '../auth.crypto.js'
import type { AuthenticatedRequest } from './session.guard.js'

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly cookies: AuthCookies) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const header = request.headers['x-csrf-token']
    const cookie = this.cookies.readCsrfCookie(request)
    const expectedHash = request.authentication?.session.csrfTokenHash

    if (
      typeof header !== 'string' ||
      !cookie ||
      !expectedHash ||
      !constantTimeStringMatch(header, cookie) ||
      !constantTimeTokenMatch(header, expectedHash)
    ) {
      throw new ForbiddenException('CSRF validation failed.')
    }
    return true
  }
}
