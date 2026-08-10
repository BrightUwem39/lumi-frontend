import { Controller, Get, Param, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthenticatedRequest } from '../auth/guards/session.guard.js'
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard.js'
import { SessionGuard } from '../auth/guards/session.guard.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { CartCsrfGuard } from '../cart/cart-csrf.guard.js'
import { CartCookies } from '../cart/cart.cookies.js'
import { OrderNumberParamsDto } from './dto/order-params.dto.js'
import { OrdersService } from './orders.service.js'

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
@UseInterceptors(NoStoreInterceptor)
export class OrdersController {
  constructor(private readonly orders: OrdersService, private readonly cartCookies: CartCookies) {}

  @Get()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: "Lists the authenticated customer's orders" })
  list(@Req() request: AuthenticatedRequest) {
    return this.orders.list(request.authentication!.user.id)
  }

  @Get(':orderNumber')
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({ summary: 'Returns an owner-authorized order snapshot' })
  get(@Req() request: AuthenticatedRequest, @Param() params: OrderNumberParamsDto) {
    return this.orders.get(
      params.orderNumber,
      request.authentication?.user.id,
      this.cartCookies.readCartToken(request),
    )
  }

  @Post(':orderNumber/cancel')
  @UseGuards(OptionalSessionGuard, CartCsrfGuard)
  @ApiOperation({ summary: 'Cancels an owner-authorized unpaid order draft' })
  cancel(@Req() request: AuthenticatedRequest, @Param() params: OrderNumberParamsDto) {
    return this.orders.cancel(
      params.orderNumber,
      request.authentication?.user.id,
      this.cartCookies.readCartToken(request),
    )
  }
}
