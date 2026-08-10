import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { constantTimeStringMatch } from '../auth/auth.crypto.js'
import type { AuthenticatedRequest } from '../auth/guards/session.guard.js'
import { CartCookies } from './cart.cookies.js'

@Injectable()
export class CartCsrfGuard implements CanActivate {
  constructor(private readonly cookies: CartCookies) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.cookies.readCartToken(request)
    const cookie = this.cookies.readCsrfCookie(request)
    const header = request.headers['x-cart-csrf-token']

    if (
      !token ||
      !cookie ||
      typeof header !== 'string' ||
      !constantTimeStringMatch(header, cookie) ||
      !constantTimeStringMatch(header, this.cookies.csrfForToken(token))
    ) {
      throw new ForbiddenException('Cart CSRF validation failed.')
    }
    return true
  }
}
