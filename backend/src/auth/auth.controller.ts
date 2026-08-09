import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { AuthCookies } from './auth.cookies.js'
import { AuthService } from './auth.service.js'
import type { RequestAuthentication } from './auth.types.js'
import { CurrentAuthentication } from './decorators/current-auth.decorator.js'
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto.js'
import { CsrfGuard } from './guards/csrf.guard.js'
import { SessionGuard } from './guards/session.guard.js'
import { NoStoreInterceptor } from './no-store.interceptor.js'

@ApiTags('authentication')
@Controller({ path: 'auth', version: '1' })
@UseInterceptors(NoStoreInterceptor)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registers a customer and requests email verification' })
  register(@Body() input: RegisterDto) {
    return this.auth.register(input)
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Consumes a single-use email verification token' })
  verifyEmail(@Body() input: TokenDto) {
    return this.auth.verifyEmail(input)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Creates an opaque server-side customer session' })
  async login(
    @Body() input: LoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.auth.login(input, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    })
    this.cookies.setAuthenticationCookies(
      reply,
      result.sessionToken,
      result.csrfToken,
      result.expiresAt,
    )
    return { user: result.user, csrfToken: result.csrfToken }
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('lumi_session')
  @ApiOperation({ summary: 'Returns the authenticated customer' })
  me(@CurrentAuthentication() authentication: RequestAuthentication) {
    return { user: authentication.user }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionGuard, CsrfGuard)
  @ApiCookieAuth('lumi_session')
  @ApiOperation({ summary: 'Revokes the current session' })
  async logout(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.auth.logout(authentication.session.id)
    this.cookies.clearAuthenticationCookies(reply)
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionGuard, CsrfGuard)
  @ApiCookieAuth('lumi_session')
  @ApiOperation({ summary: 'Revokes every session belonging to the customer' })
  async logoutAll(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.auth.logoutAll(authentication.user.id)
    this.cookies.clearAuthenticationCookies(reply)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Requests a single-use password reset token' })
  forgotPassword(@Body() input: EmailDto) {
    return this.auth.requestPasswordReset(input)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Replaces a password and revokes existing sessions' })
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.auth.resetPassword(input)
  }
}
