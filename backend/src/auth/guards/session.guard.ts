import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AuthCookies } from '../auth.cookies.js'
import { AuthService } from '../auth.service.js'
import type { RequestAuthentication } from '../auth.types.js'

export type AuthenticatedRequest = FastifyRequest & {
  authentication?: RequestAuthentication
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const sessionToken = this.cookies.readSessionToken(request)
    if (!sessionToken) throw new UnauthorizedException('Authentication required.')

    const authentication = await this.auth.authenticate(sessionToken)
    if (!authentication) throw new UnauthorizedException('Authentication required.')

    request.authentication = authentication
    return true
  }
}
