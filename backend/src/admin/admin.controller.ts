import { Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'
import { CurrentAuthentication } from '../auth/decorators/current-auth.decorator.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { SessionGuard } from '../auth/guards/session.guard.js'
import type { RequestAuthentication } from '../auth/auth.types.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { UserRole } from '../generated/prisma/client.js'
import { AdminService } from './admin.service.js'

@ApiTags('administration')
@ApiCookieAuth('lumi_session')
@Controller({ path: 'admin', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR)
@UseInterceptors(NoStoreInterceptor)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Returns the administrator dashboard overview' })
  dashboard(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Req() request: FastifyRequest,
  ) {
    return this.admin.dashboard(authentication.user, request.headers['user-agent'])
  }
}
