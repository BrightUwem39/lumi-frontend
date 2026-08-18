import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'
import { CurrentAuthentication } from '../auth/decorators/current-auth.decorator.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { SessionGuard } from '../auth/guards/session.guard.js'
import { CsrfGuard } from '../auth/guards/csrf.guard.js'
import type { RequestAuthentication } from '../auth/auth.types.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { UserRole } from '../generated/prisma/client.js'
import { AdminService } from './admin.service.js'
import {
  AdminListQueryDto,
  AdminOrderParamsDto,
  AdminOrderQueryDto,
  AdminProductParamsDto,
  AdminProductQueryDto,
  AdminRevenueQueryDto,
  UpdateFulfillmentStatusDto,
  UpdateInventoryDto,
} from './dto/admin.dto.js'
import {
  CreateAdminProductDto,
  DeleteAdminProductDto,
  UpdateAdminProductDto,
} from './dto/admin-product.dto.js'
import {
  AdminCouponParamsDto,
  CreateAdminCouponDto,
  UpdateAdminCouponStatusDto,
} from './dto/admin-coupon.dto.js'

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

  @Get('products')
  @ApiOperation({ summary: 'Lists products with administrator inventory data' })
  products(@Query() query: AdminProductQueryDto) {
    return this.admin.listProducts(query)
  }

  @Post('products')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Creates a catalog product' })
  createProduct(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: CreateAdminProductDto,
  ) {
    return this.admin.createProduct(authentication.user, input)
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Returns daily administrator revenue analytics' })
  revenueAnalytics(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Query() query: AdminRevenueQueryDto,
    @Req() request: FastifyRequest,
  ) {
    return this.admin.revenueAnalytics(
      authentication.user,
      query.days,
      request.headers['user-agent'],
    )
  }

  @Patch('products/:productId/inventory')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Sets on-hand inventory with a required audit reason' })
  inventory(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminProductParamsDto,
    @Body() input: UpdateInventoryDto,
  ) {
    return this.admin.updateInventory(authentication.user, params.productId, input)
  }

  @Patch('products/:productId')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Updates catalog product details and publication state' })
  updateProduct(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminProductParamsDto,
    @Body() input: UpdateAdminProductDto,
  ) {
    return this.admin.updateProduct(authentication.user, params.productId, input)
  }

  @Delete('products/:productId')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Permanently deletes an archived catalog product' })
  deleteProduct(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminProductParamsDto,
    @Body() input: DeleteAdminProductDto,
  ) {
    return this.admin.deleteProduct(authentication.user, params.productId, input)
  }

  @Get('customers')
  @ApiOperation({ summary: 'Lists customers using a minimized administrator view' })
  customers(@Query() query: AdminListQueryDto) {
    return this.admin.listCustomers(query)
  }

  @Get('discounts')
  @ApiOperation({ summary: 'Lists administrator discount codes' })
  discounts() {
    return this.admin.listCoupons()
  }

  @Post('discounts')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Creates an audited discount code' })
  createDiscount(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: CreateAdminCouponDto,
  ) {
    return this.admin.createCoupon(authentication.user, input)
  }

  @Patch('discounts/:couponId/status')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Activates or deactivates a discount code' })
  discountStatus(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminCouponParamsDto,
    @Body() input: UpdateAdminCouponStatusDto,
  ) {
    return this.admin.updateCouponStatus(authentication.user, params.couponId, input)
  }

  @Get('orders')
  @ApiOperation({ summary: 'Lists orders for administrator fulfilment work' })
  orders(@Query() query: AdminOrderQueryDto) {
    return this.admin.listOrders(query)
  }

  @Get('orders/:orderNumber')
  @ApiOperation({ summary: 'Returns complete administrator order detail' })
  order(@Param() params: AdminOrderParamsDto) {
    return this.admin.getOrder(params.orderNumber)
  }

  @Patch('orders/:orderNumber/status')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Applies a valid forward fulfilment transition' })
  fulfillmentStatus(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminOrderParamsDto,
    @Body() input: UpdateFulfillmentStatusDto,
  ) {
    return this.admin.updateFulfillmentStatus(authentication.user, params.orderNumber, input)
  }
}
