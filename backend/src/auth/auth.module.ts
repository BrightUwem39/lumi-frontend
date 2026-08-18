import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller.js'
import { AuthCookies } from './auth.cookies.js'
import { AuthService } from './auth.service.js'
import { CsrfGuard } from './guards/csrf.guard.js'
import { RolesGuard } from './guards/roles.guard.js'
import { SessionGuard } from './guards/session.guard.js'
import { NoStoreInterceptor } from './no-store.interceptor.js'
import { OptionalSessionGuard } from './guards/optional-session.guard.js'
import { BrevoEmailService } from './brevo-email.service.js'

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    BrevoEmailService,
    AuthCookies,
    SessionGuard,
    CsrfGuard,
    RolesGuard,
    NoStoreInterceptor,
    OptionalSessionGuard,
  ],
  exports: [
    AuthService,
    BrevoEmailService,
    AuthCookies,
    SessionGuard,
    CsrfGuard,
    RolesGuard,
    NoStoreInterceptor,
    OptionalSessionGuard,
  ],
})
export class AuthModule {}
