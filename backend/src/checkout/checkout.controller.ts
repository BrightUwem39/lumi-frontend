import { Body, Controller, Headers, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthenticatedRequest } from '../auth/guards/session.guard.js'
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { CartCsrfGuard } from '../cart/cart-csrf.guard.js'
import { CartCookies } from '../cart/cart.cookies.js'
import { CheckoutService } from './checkout.service.js'
import { CreateOrderDto, ValidateCouponDto } from './dto/create-order.dto.js'

@ApiTags('checkout')
@Controller({ path: 'checkout', version: '1' })
@UseGuards(OptionalSessionGuard)
@UseInterceptors(NoStoreInterceptor)
export class CheckoutController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly cartCookies: CartCookies,
  ) {}

  @Post('orders')
  @UseGuards(CartCsrfGuard)
  @ApiOperation({ summary: 'Creates an idempotent, non-payable order draft from the cart' })
  createDraft(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() input: CreateOrderDto,
  ) {
    const cartToken = this.cartCookies.readCartToken(request)
    if (!cartToken) throw new Error('Cart token missing after CSRF validation')
    return this.checkout.createDraft(
      request.authentication?.user.id,
      cartToken,
      idempotencyKey ?? '',
      input,
    )
  }

  @Post('coupons/validate')
  @UseGuards(CartCsrfGuard)
  @ApiOperation({ summary: 'Validates a discount code against the current server cart' })
  validateCoupon(
    @Req() request: AuthenticatedRequest,
    @Body() input: ValidateCouponDto,
  ) {
    const cartToken = this.cartCookies.readCartToken(request)
    if (!cartToken) throw new Error('Cart token missing after CSRF validation')
    return this.checkout.validateCoupon(
      request.authentication?.user.id,
      cartToken,
      input.couponCode,
    )
  }
}
