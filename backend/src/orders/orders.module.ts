import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { CartModule } from '../cart/cart.module.js'
import { OrdersController } from './orders.controller.js'
import { OrdersService } from './orders.service.js'

@Module({ imports: [AuthModule, CartModule], controllers: [OrdersController], providers: [OrdersService] })
export class OrdersModule {}
