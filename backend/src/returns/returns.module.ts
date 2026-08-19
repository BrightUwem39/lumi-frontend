import { Module } from '@nestjs/common'
import { ReturnsService } from '../admin/returns.service.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({ imports: [AuthModule], providers: [ReturnsService], exports: [ReturnsService] })
export class ReturnsModule {}
