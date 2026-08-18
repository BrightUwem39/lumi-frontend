import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { PaymentsModule } from '../payments/payments.module.js'
import { AdminController } from './admin.controller.js'
import { AdminService } from './admin.service.js'

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
