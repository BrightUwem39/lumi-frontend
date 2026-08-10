import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { CartModule } from '../cart/cart.module.js'
import { CheckoutController } from './checkout.controller.js'
import { CheckoutService } from './checkout.service.js'

@Module({
  imports: [AuthModule, CartModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
