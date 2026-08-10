import { Controller, Get, Headers, Param, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { RawBodyRequest } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import type { AuthenticatedRequest } from '../auth/guards/session.guard.js'
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { CartCsrfGuard } from '../cart/cart-csrf.guard.js'
import { CartCookies } from '../cart/cart.cookies.js'
import { PaymentsService } from './payments.service.js'

@ApiTags('payments')
@Controller({ path: 'payments/paystack', version: '1' })
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly cartCookies: CartCookies,
  ) {}

  @Get('availability')
  @UseInterceptors(NoStoreInterceptor)
  availability() {
    return this.payments.availability()
  }

  @Get('status/:reference')
  @UseGuards(OptionalSessionGuard)
  @UseInterceptors(NoStoreInterceptor)
  status(
    @Param('reference') reference: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.payments.status(
      reference,
      request.authentication?.user.id,
      this.cartCookies.readCartToken(request),
    )
  }

  @Post('initialize/:orderNumber')
  @UseGuards(OptionalSessionGuard, CartCsrfGuard)
  @UseInterceptors(NoStoreInterceptor)
  @ApiOperation({ summary: 'Reserves stock and creates a server-side Paystack payment session' })
  initialize(
    @Param('orderNumber') orderNumber: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.payments.initialize(
      orderNumber,
      request.authentication?.user.id,
      this.cartCookies.readCartToken(request),
    )
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Processes signed Paystack events idempotently' })
  webhook(
    @Req() request: RawBodyRequest<FastifyRequest>,
    @Headers('x-paystack-signature') signature: string | undefined,
  ) {
    return this.payments.processWebhook(request.rawBody, signature)
  }
}
