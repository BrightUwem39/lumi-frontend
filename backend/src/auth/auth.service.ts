import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserStatus } from '../generated/prisma/enums.js'
import { PrismaService } from '../database/prisma.service.js'
import { AUTH_MESSAGES } from './auth.constants.js'
import {
  createOpaqueToken,
  hashPassword,
  hashPrivateIdentifier,
  hashToken,
  verifyAgainstDummyPassword,
  verifyPassword,
} from './auth.crypto.js'
import type { RequestAuthentication } from './auth.types.js'
import type {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto.js'

type RequestMetadata = {
  ip: string
  userAgent?: string
}

@Injectable()
export class AuthService {
  private readonly cookieSecret: string
  private readonly exposeDevelopmentTokens: boolean

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.cookieSecret = config.getOrThrow<string>('COOKIE_SECRET')
    this.exposeDevelopmentTokens =
      config.getOrThrow<boolean>('AUTH_DEV_TOKENS_ENABLED')
  }

  async register(input: RegisterDto) {
    // Hash before the lookup so existing and new accounts do comparable work.
    const passwordHash = await hashPassword(input.password)
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, status: true },
    })

    if (existing) {
      if (existing.status === UserStatus.PENDING_VERIFICATION) {
        const token = await this.replaceVerificationToken(existing.id)
        return this.acceptedRegistrationResponse(token)
      }
      return this.acceptedRegistrationResponse()
    }

    const token = createOpaqueToken()
    const expiresAt = this.minutesFromNow(
      this.config.getOrThrow<number>('VERIFICATION_TTL_MINUTES'),
    )

    try {
      await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          verificationTokens: {
            create: { tokenHash: hashToken(token), expiresAt },
          },
        },
      })
    } catch (error) {
      // A concurrent unique-email race stays generic; operational failures still surface.
      if (this.isUniqueConstraintError(error)) {
        return this.acceptedRegistrationResponse()
      }
      throw error
    }

    return this.acceptedRegistrationResponse(token)
  }

  async verifyEmail(input: TokenDto) {
    const now = new Date()
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(input.token) },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
        user: { select: { status: true } },
      },
    })

    if (
      !record ||
      record.usedAt ||
      record.expiresAt <= now ||
      record.user.status !== UserStatus.PENDING_VERIFICATION
    ) {
      throw new BadRequestException('The verification token is invalid or expired.')
    }

    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (claimed.count !== 1) {
        throw new BadRequestException('The verification token is invalid or expired.')
      }

      await transaction.user.update({
        where: { id: record.userId },
        data: { status: UserStatus.ACTIVE, emailVerifiedAt: now },
      })
      await transaction.emailVerificationToken.deleteMany({
        where: { userId: record.userId, id: { not: record.id } },
      })
    })

    return { message: 'Email address verified. You can now sign in.' }
  }

  async login(input: LoginDto, metadata: RequestMetadata) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    })

    if (!user?.passwordHash) {
      await verifyAgainstDummyPassword(input.password)
      throw new UnauthorizedException(AUTH_MESSAGES.invalidCredentials)
    }

    const validPassword = await verifyPassword(input.password, user.passwordHash)
    if (!validPassword || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException(AUTH_MESSAGES.invalidCredentials)
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Email verification is required.')
    }

    const sessionToken = createOpaqueToken()
    const csrfToken = createOpaqueToken()
    const expiresAt = this.hoursFromNow(
      this.config.getOrThrow<number>('SESSION_TTL_HOURS'),
    )

    await this.prisma.$transaction([
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(sessionToken),
          csrfTokenHash: hashToken(csrfToken),
          expiresAt,
          ipHash: hashPrivateIdentifier(metadata.ip, this.cookieSecret),
          userAgent: metadata.userAgent?.slice(0, 500),
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ])

    return {
      sessionToken,
      csrfToken,
      expiresAt,
      user: this.publicUser(user),
    }
  }

  async authenticate(sessionToken: string): Promise<RequestAuthentication | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(sessionToken) },
      select: {
        id: true,
        tokenHash: true,
        csrfTokenHash: true,
        expiresAt: true,
        revokedAt: true,
        lastSeenAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
      },
    })

    const now = new Date()
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      return null
    }

    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60_000) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      })
    }

    return {
      user: this.publicUser(session.user),
      session: {
        id: session.id,
        tokenHash: session.tokenHash,
        csrfTokenHash: session.csrfTokenHash,
        expiresAt: session.expiresAt,
      },
    }
  }

  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async requestPasswordReset(input: EmailDto) {
    // Both existing and missing accounts pay a password-hash cost to reduce timing leaks.
    await verifyAgainstDummyPassword(createOpaqueToken())
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, status: true },
    })

    if (!user || user.status !== UserStatus.ACTIVE) {
      return this.acceptedRecoveryResponse()
    }

    const token = createOpaqueToken()
    const expiresAt = this.minutesFromNow(
      this.config.getOrThrow<number>('RESET_TTL_MINUTES'),
    )
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
      }),
    ])

    return this.acceptedRecoveryResponse(token)
  }

  async resetPassword(input: ResetPasswordDto) {
    // Hash first to keep invalid-token requests computationally bounded and comparable.
    const passwordHash = await hashPassword(input.newPassword)
    const now = new Date()
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(input.token) },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    })

    if (!record || record.usedAt || record.expiresAt <= now) {
      throw new BadRequestException('The password reset token is invalid or expired.')
    }

    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (claimed.count !== 1) {
        throw new BadRequestException('The password reset token is invalid or expired.')
      }

      await transaction.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      })
      await transaction.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      })
      await transaction.passwordResetToken.deleteMany({
        where: { userId: record.userId, id: { not: record.id } },
      })
    })

    return { message: 'Password updated. Sign in again on all devices.' }
  }

  private async replaceVerificationToken(userId: string) {
    const token = createOpaqueToken()
    const expiresAt = this.minutesFromNow(
      this.config.getOrThrow<number>('VERIFICATION_TTL_MINUTES'),
    )
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.create({
        data: { userId, tokenHash: hashToken(token), expiresAt },
      }),
    ])
    return token
  }

  private acceptedRegistrationResponse(token?: string) {
    return {
      message: AUTH_MESSAGES.registrationAccepted,
      ...(token && this.exposeDevelopmentTokens
        ? { development: { verificationToken: token } }
        : {}),
    }
  }

  private acceptedRecoveryResponse(token?: string) {
    return {
      message: AUTH_MESSAGES.recoveryAccepted,
      ...(token && this.exposeDevelopmentTokens
        ? { development: { resetToken: token } }
        : {}),
    }
  }

  private publicUser(user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: RequestAuthentication['user']['role']
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  }

  private minutesFromNow(minutes: number) {
    return new Date(Date.now() + minutes * 60_000)
  }

  private hoursFromNow(hours: number) {
    return new Date(Date.now() + hours * 60 * 60_000)
  }

  private isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    )
  }
}
