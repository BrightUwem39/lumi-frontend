import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { RequestAuthentication } from '../auth/auth.types.js'
import { CurrentAuthentication } from '../auth/decorators/current-auth.decorator.js'
import { CsrfGuard } from '../auth/guards/csrf.guard.js'
import { SessionGuard } from '../auth/guards/session.guard.js'
import { NoStoreInterceptor } from '../auth/no-store.interceptor.js'
import { AddressesService } from './addresses.service.js'
import { AddressParamsDto, CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js'

@ApiTags('addresses')
@ApiCookieAuth('lumi_session')
@Controller({ path: 'addresses', version: '1' })
@UseGuards(SessionGuard)
@UseInterceptors(NoStoreInterceptor)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiOperation({ summary: "Lists the authenticated customer's saved addresses" })
  list(@CurrentAuthentication() authentication: RequestAuthentication) {
    return this.addresses.list(authentication.user.id)
  }

  @Post()
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Creates a saved delivery address' })
  create(@CurrentAuthentication() authentication: RequestAuthentication, @Body() input: CreateAddressDto) {
    return this.addresses.create(authentication.user.id, input)
  }

  @Patch(':addressId')
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Updates an owner-authorized saved delivery address' })
  update(@CurrentAuthentication() authentication: RequestAuthentication, @Param() params: AddressParamsDto, @Body() input: UpdateAddressDto) {
    return this.addresses.update(authentication.user.id, params.addressId, input)
  }

  @Delete(':addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Removes an owner-authorized saved delivery address' })
  async remove(@CurrentAuthentication() authentication: RequestAuthentication, @Param() params: AddressParamsDto) {
    await this.addresses.remove(authentication.user.id, params.addressId)
  }
}
