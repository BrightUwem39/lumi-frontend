import { createHmac } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { createOpaqueToken } from '../auth/auth.crypto.js'

const CART_COOKIE_DEVELOPMENT = 'lumi_cart'
const CART_COOKIE_PRODUCTION = '__Host-lumi_cart'
const CART_CSRF_COOKIE_DEVELOPMENT = 'lumi_cart_csrf'
const CART_CSRF_COOKIE_PRODUCTION = '__Host-lumi_cart_csrf'

@Injectable()
export class CartCookies {
  private readonly production: boolean
  private readonly secret: string
  private readonly cartCookieName: string
  private readonly csrfCookieName: string

  constructor(config: ConfigService) {
    this.production = config.getOrThrow<string>('NODE_ENV') === 'production'
    this.secret = config.getOrThrow<string>('COOKIE_SECRET')
    this.cartCookieName = this.production
      ? CART_COOKIE_PRODUCTION
      : CART_COOKIE_DEVELOPMENT
    this.csrfCookieName = this.production
      ? CART_CSRF_COOKIE_PRODUCTION
      : CART_CSRF_COOKIE_DEVELOPMENT
  }

  ensure(request: FastifyRequest, reply: FastifyReply) {
    const token = this.readCartToken(request) ?? createOpaqueToken()
    const csrfToken = this.csrfForToken(token)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60_000)
    const shared = {
      path: '/',
      secure: this.production,
      sameSite: 'lax' as const,
      expires,
    }

    reply.setCookie(this.cartCookieName, token, {
      ...shared,
      httpOnly: true,
      signed: true,
    })
    reply.setCookie(this.csrfCookieName, csrfToken, {
      ...shared,
      httpOnly: false,
      signed: false,
    })
    return token
  }

  readCartToken(request: FastifyRequest) {
    const signedToken = request.cookies[this.cartCookieName]
    if (!signedToken) return null
    const unsigned = request.unsignCookie(signedToken)
    return unsigned.valid ? unsigned.value : null
  }

  readCsrfCookie(request: FastifyRequest) {
    return request.cookies[this.csrfCookieName] ?? null
  }

  csrfForToken(token: string) {
    return createHmac('sha256', this.secret)
      .update(`cart-csrf:${token}`)
      .digest('base64url')
  }
}
