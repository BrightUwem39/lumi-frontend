import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator'
import { CouponType } from '../../generated/prisma/client.js'

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value
const upper = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value

export class AdminCouponParamsDto {
  @IsUUID()
  couponId!: string
}

export class CreateAdminCouponDto {
  @Transform(upper)
  @IsString()
  @Length(3, 64)
  @Matches(/^[A-Z0-9][A-Z0-9_-]+$/)
  code!: string

  @IsIn(Object.values(CouponType))
  type!: CouponType

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  value!: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  @IsOptional()
  minimumSubtotal?: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  @IsOptional()
  maximumDiscount?: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  @IsOptional()
  usageLimit?: number

  @IsDateString()
  @IsOptional()
  startsAt?: string

  @IsDateString()
  @IsOptional()
  expiresAt?: string

  @IsBoolean()
  active!: boolean

  @Transform(trim)
  @IsString()
  @Length(3, 500)
  reason!: string
}

export class UpdateAdminCouponStatusDto {
  @IsBoolean()
  active!: boolean

  @Transform(trim)
  @IsString()
  @Length(3, 500)
  reason!: string
}
