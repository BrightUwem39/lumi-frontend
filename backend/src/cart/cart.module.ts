import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { CartCsrfGuard } from './cart-csrf.guard.js'
import { CartController } from './cart.controller.js'
import { CartCookies } from './cart.cookies.js'
import { CartService } from './cart.service.js'

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartService, CartCookies, CartCsrfGuard],
  exports: [CartService, CartCookies, CartCsrfGuard],
})
export class CartModule {}
