import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnApplicationShutdown {
  constructor(config: ConfigService) {
    // The PostgreSQL driver adapter receives its connection string only on the server.
    const adapter = new PrismaPg({ connectionString: config.getOrThrow<string>('DATABASE_URL') })
    super({ adapter })
  }

  async onApplicationShutdown() {
    await this.$disconnect()
  }
}
