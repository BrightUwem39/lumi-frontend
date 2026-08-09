import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'
import { PrismaService } from '../database/prisma.service.js'

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async check(key = 'database') {
    const result = this.indicator.check(key)
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return result.up()
    } catch {
      // Readiness reports an unavailable dependency without exposing credentials/errors.
      return result.down({ message: 'Database connection unavailable' })
    }
  }
}
