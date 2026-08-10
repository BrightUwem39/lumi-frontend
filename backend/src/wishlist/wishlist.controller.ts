import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { RequestAuthentication } from '../auth/auth.types.js'
import { CurrentAuthentication } from '../auth/decorators/current-auth.decorator.js'
import { CsrfGuard } from '../auth/guards/csrf.guard.js'
import { SessionGuard } from '../auth/guards/session.guard.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import {
  WishlistProductDto,
  WishlistProductParamsDto,
} from './dto/wishlist.dto.js'
import { WishlistService } from './wishlist.service.js'

@ApiTags('wishlist')
@ApiCookieAuth('lumi_session')
@Controller({ path: 'wishlist', version: '1' })
@UseGuards(SessionGuard)
@UseInterceptors(NoStoreInterceptor)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Lists the authenticated customer's wishlist" })
  list(@CurrentAuthentication() authentication: RequestAuthentication) {
    return this.wishlist.list(authentication.user.id)
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: "Adds a product to the authenticated customer's wishlist" })
  add(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: WishlistProductDto,
  ) {
    return this.wishlist.add(authentication.user.id, input.productSlug)
  }

  @Delete(':productSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: "Removes a product from the authenticated customer's wishlist" })
  async remove(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: WishlistProductParamsDto,
  ) {
    await this.wishlist.remove(authentication.user.id, params.productSlug)
  }
}
