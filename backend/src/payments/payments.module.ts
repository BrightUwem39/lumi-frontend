import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { CartModule } from '../cart/cart.module.js'
import { PaystackClient } from './paystack.client.js'
import { PaymentReconciliationWorker } from './payment-reconciliation.worker.js'
import { PaymentsController } from './payments.controller.js'
import { PaymentsService } from './payments.service.js'

@Module({
  imports: [AuthModule, CartModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackClient, PaymentReconciliationWorker],
})
export class PaymentsModule {}
