import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service.js'

// A single application-scoped Prisma client prevents unnecessary connection pools.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
