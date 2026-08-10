import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthCookies } from '../auth.cookies.js'
import { AuthService } from '../auth.service.js'
import type { AuthenticatedRequest } from './session.guard.js'

@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const sessionToken = this.cookies.readSessionToken(request)
    if (sessionToken) {
      request.authentication = (await this.auth.authenticate(sessionToken)) ?? undefined
    }
    return true
  }
}
