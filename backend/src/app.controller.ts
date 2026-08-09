import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('system')
@Controller({ version: '1' })
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Returns public API metadata' })
  metadata() {
    return {
      name: 'Lumi API',
      version: '1',
      status: 'available',
    }
  }
}
