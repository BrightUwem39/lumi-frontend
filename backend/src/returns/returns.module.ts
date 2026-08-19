import { Module } from '@nestjs/common'
import { ReturnsService } from '../admin/returns.service.js'

@Module({ providers: [ReturnsService], exports: [ReturnsService] })
export class ReturnsModule {}
