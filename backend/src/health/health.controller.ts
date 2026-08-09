import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DatabaseHealthIndicator } from './database.health.js'

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Confirms the API process is alive' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Confirms required services are ready' })
  readiness() {
    return this.health.check([() => this.database.check()])
  }
}
