import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  CSRF_COOKIE_DEVELOPMENT,
  CSRF_COOKIE_PRODUCTION,
  SESSION_COOKIE_DEVELOPMENT,
  SESSION_COOKIE_PRODUCTION,
} from './auth.constants.js'

@Injectable()
export class AuthCookies {
  private readonly production: boolean
  private readonly sessionCookieName: string
  private readonly csrfCookieName: string

  constructor(private readonly config: ConfigService) {
    this.production = config.getOrThrow<string>('NODE_ENV') === 'production'
    this.sessionCookieName = this.production
      ? SESSION_COOKIE_PRODUCTION
      : SESSION_COOKIE_DEVELOPMENT
    this.csrfCookieName = this.production
      ? CSRF_COOKIE_PRODUCTION
      : CSRF_COOKIE_DEVELOPMENT
  }

  setAuthenticationCookies(
    reply: FastifyReply,
    sessionToken: string,
    csrfToken: string,
    expiresAt: Date,
  ) {
    const shared = {
      path: '/',
      secure: this.production,
      sameSite: 'lax' as const,
      expires: expiresAt,
    }

    reply.setCookie(this.sessionCookieName, sessionToken, {
      ...shared,
      httpOnly: true,
      signed: true,
    })
    reply.setCookie(this.csrfCookieName, csrfToken, {
      ...shared,
      httpOnly: false,
      signed: false,
    })
  }

  clearAuthenticationCookies(reply: FastifyReply) {
    const shared = {
      path: '/',
      secure: this.production,
      sameSite: 'lax' as const,
    }
    reply.clearCookie(this.sessionCookieName, { ...shared, httpOnly: true })
    reply.clearCookie(this.csrfCookieName, { ...shared, httpOnly: false })
  }

  readSessionToken(request: FastifyRequest) {
    const signedToken = request.cookies[this.sessionCookieName]
    if (!signedToken) return null
    const unsigned = request.unsignCookie(signedToken)
    return unsigned.valid ? unsigned.value : null
  }

  readCsrfCookie(request: FastifyRequest) {
    return request.cookies[this.csrfCookieName] ?? null
  }
}
