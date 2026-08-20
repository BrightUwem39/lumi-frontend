import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
import { RefundsService } from '../payments/refunds.service.js'
import { AdminService } from './admin.service.js'
import { ReturnsService } from './returns.service.js'
import {
  AdminReturnParamsDto,
  CompleteAdminReturnDto,
  CreateAdminReturnDto,
  UpdateAdminReturnStatusDto,
} from './dto/admin-return.dto.js'
import {
  AdminListQueryDto,
  AdminAuditQueryDto,
  AdminReportQueryDto,
  AdminOrderParamsDto,
  AdminOrderQueryDto,
  AdminProductParamsDto,
  AdminProductQueryDto,
  AdminRevenueQueryDto,
  AdminSecurityActionDto,
  AdminSessionParamsDto,
  CreateAdminRefundDto,
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
import { UpdateNotificationSettingsDto, UpdateShippingSettingsDto, UpdateStoreProfileDto, UpdateTaxSettingsDto } from './dto/admin-settings.dto.js'
import { AdminNotificationActionDto } from './dto/admin-notification.dto.js'

@ApiTags('administration')
@ApiCookieAuth('lumi_session')
@Controller({ path: 'admin', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR)
@UseInterceptors(NoStoreInterceptor)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly refunds: RefundsService,
    private readonly returns: ReturnsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Returns the administrator dashboard overview' })
  dashboard(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Req() request: FastifyRequest,
  ) {
    return this.admin.dashboard(authentication.user, request.headers['user-agent'])
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Returns live operational alerts for the administrator notification centre' })
  notifications() {
    return this.admin.notifications()
  }

  @Get('audit-log/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="lumi-audit-log.csv"')
  @ApiOperation({ summary: 'Exports the complete filtered administrator audit trail as CSV' })
  exportAuditLog(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Query() query: AdminAuditQueryDto,
  ) {
    return this.admin.exportAuditLog(authentication.user, query)
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Returns a paginated read-only administrator audit trail' })
  auditLog(@Query() query: AdminAuditQueryDto) {
    return this.admin.auditLog(query)
  }

  @Get('reports/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="lumi-business-report.csv"')
  @ApiOperation({ summary: 'Exports an administrator business report as CSV' })
  exportReport(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Query() query: AdminReportQueryDto,
  ) {
    return this.admin.exportReport(authentication.user, query)
  }

  @Post('notifications/dismiss')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Dismisses an operational notification with an audit trail' })
  dismissNotification(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: AdminNotificationActionDto,
  ) {
    return this.admin.dismissNotification(authentication.user, input.notificationKey)
  }

  @Post('notifications/email-retry')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Reconstructs and retries a failed customer email notification' })
  retryNotificationEmail(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: AdminNotificationActionDto,
  ) {
    return this.admin.retryNotificationEmail(authentication.user, input.notificationKey)
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

  @Get('settings')
  @ApiOperation({ summary: 'Returns administrator store settings' })
  settings() {
    return this.admin.getSettings()
  }

  @Patch('settings/store-profile')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Updates the audited store profile settings' })
  storeProfile(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: UpdateStoreProfileDto,
  ) {
    return this.admin.updateStoreProfile(authentication.user, input)
  }

  @Patch('settings/shipping')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Updates audited storefront shipping settings' })
  shippingSettings(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: UpdateShippingSettingsDto,
  ) {
    return this.admin.updateShippingSettings(authentication.user, input)
  }

  @Patch('settings/tax')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Updates audited storefront tax settings' })
  taxSettings(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: UpdateTaxSettingsDto,
  ) {
    return this.admin.updateTaxSettings(authentication.user, input)
  }

  @Patch('settings/notifications')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Updates audited operational email notification settings' })
  notificationSettings(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: UpdateNotificationSettingsDto,
  ) {
    return this.admin.updateNotificationSettings(authentication.user, input)
  }

  @Get('settings/security')
  @ApiOperation({ summary: 'Returns administrator sessions and recent security activity' })
  accountSecurity(@CurrentAuthentication() authentication: RequestAuthentication) {
    return this.admin.getAccountSecurity(authentication.user, authentication.session.id)
  }

  @Delete('settings/security/sessions/:sessionId')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Revokes another administrator session' })
  revokeSession(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminSessionParamsDto,
    @Body() input: AdminSecurityActionDto,
  ) {
    return this.admin.revokeSession(authentication.user, authentication.session.id, params.sessionId, input.reason)
  }

  @Post('settings/security/sessions/revoke-others')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Revokes every other session for the administrator' })
  revokeOtherSessions(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Body() input: AdminSecurityActionDto,
  ) {
    return this.admin.revokeOtherSessions(authentication.user, authentication.session.id, input.reason)
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

  @Post('orders/:orderNumber/refunds')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Queues an audited full or partial Paystack refund' })
  refundOrder(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminOrderParamsDto,
    @Body() input: CreateAdminRefundDto,
  ) {
    return this.refunds.initiate(authentication.user, params.orderNumber, input)
  }

  @Post('orders/:orderNumber/returns')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Opens an audited product return for eligible order items' })
  createReturn(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminOrderParamsDto,
    @Body() input: CreateAdminReturnDto,
  ) {
    return this.returns.create(authentication.user, params.orderNumber, input)
  }

  @Patch('returns/:returnId/status')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Applies a valid audited return status transition' })
  updateReturnStatus(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminReturnParamsDto,
    @Body() input: UpdateAdminReturnStatusDto,
  ) {
    return this.returns.updateStatus(authentication.user, params.returnId, input)
  }

  @Post('returns/:returnId/complete')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Completes a received return and applies explicit inventory restock quantities' })
  completeReturn(
    @CurrentAuthentication() authentication: RequestAuthentication,
    @Param() params: AdminReturnParamsDto,
    @Body() input: CompleteAdminReturnDto,
  ) {
    return this.returns.complete(authentication.user, params.returnId, input)
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
