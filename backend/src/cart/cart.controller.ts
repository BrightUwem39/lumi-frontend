import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'
import type { AuthenticatedRequest } from '../auth/guards/session.guard.js'
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { CartCsrfGuard } from './cart-csrf.guard.js'
import { CartCookies } from './cart.cookies.js'
import { CartProductParamsDto, SetCartItemDto } from './dto/cart.dto.js'
import { CartService } from './cart.service.js'

@ApiTags('cart')
@Controller({ path: 'cart', version: '1' })
@UseGuards(OptionalSessionGuard)
@UseInterceptors(NoStoreInterceptor)
export class CartController {
  constructor(
    private readonly cart: CartService,
    private readonly cookies: CartCookies,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Returns or creates the current guest/customer cart' })
  get(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const token = this.cookies.ensure(request, reply)
    return this.cart.get(request.authentication?.user.id, token)
  }

  @Put('items/:productSlug')
  @UseGuards(CartCsrfGuard)
  @ApiOperation({ summary: 'Sets a product quantity in the current cart' })
  setItem(
    @Req() request: AuthenticatedRequest,
    @Param() params: CartProductParamsDto,
    @Body() input: SetCartItemDto,
  ) {
    return this.cart.setItem(
      request.authentication?.user.id,
      this.requireCartToken(request),
      params.productSlug,
      input.quantity,
      input.size,
    )
  }

  @Delete('items/:productSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CartCsrfGuard)
  @ApiOperation({ summary: 'Removes a product from the current cart' })
  async removeItem(
    @Req() request: AuthenticatedRequest,
    @Param() params: CartProductParamsDto,
  ) {
    await this.cart.removeItem(
      request.authentication?.user.id,
      this.requireCartToken(request),
      params.productSlug,
    )
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CartCsrfGuard)
  @ApiOperation({ summary: 'Clears the current cart' })
  async clear(@Req() request: AuthenticatedRequest) {
    await this.cart.clear(
      request.authentication?.user.id,
      this.requireCartToken(request),
    )
  }

  private requireCartToken(request: AuthenticatedRequest) {
    const token = this.cookies.readCartToken(request)
    // The CSRF guard has already established that the signed token exists.
    if (!token) throw new Error('Cart token missing after CSRF validation')
    return token
  }
}
