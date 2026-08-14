import { Transform, Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator'
import { OrderStatus, ProductStatus } from '../../generated/prisma/client.js'

const trimOptional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value

export class AdminListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit = 20

  @Transform(trimOptional)
  @IsString()
  @Length(2, 100)
  @IsOptional()
  search?: string
}

export class AdminProductQueryDto extends AdminListQueryDto {
  @IsIn(Object.values(ProductStatus))
  @IsOptional()
  status?: ProductStatus
}

export class AdminOrderQueryDto extends AdminListQueryDto {
  @IsIn(Object.values(OrderStatus))
  @IsOptional()
  status?: OrderStatus
}

export class AdminProductParamsDto {
  @IsUUID()
  productId!: string
}

export class AdminOrderParamsDto {
  @IsString()
  @Matches(/^LM-[0-9]{4}-[A-Z0-9]{12}$/)
  orderNumber!: string
}

export class UpdateInventoryDto {
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  onHand!: number

  @Transform(trimOptional)
  @IsString()
  @Length(3, 500)
  reason!: string
}

const fulfillmentStatuses = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const

export class UpdateFulfillmentStatusDto {
  @IsIn(fulfillmentStatuses)
  status!: (typeof fulfillmentStatuses)[number]

  @Transform(trimOptional)
  @IsString()
  @Length(3, 500)
  reason!: string
}
