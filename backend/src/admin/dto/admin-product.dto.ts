import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { ProductStatus } from '../../generated/prisma/client.js'

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value
const trimArray = ({ value }: { value: unknown }) => Array.isArray(value)
  ? value.map((item) => typeof item === 'string' ? item.trim() : item).filter(Boolean)
  : value
const editableStatuses = [ProductStatus.DRAFT, ProductStatus.PUBLISHED, ProductStatus.ARCHIVED] as const

export class AdminProductImageDto {
  @Transform(trim)
  @IsString()
  @Length(2, 2048)
  @Matches(/^(https:\/\/|\/)[^\s]+$/, {
    message: 'image URLs must use HTTPS or begin with / for a storefront asset',
  })
  url!: string

  @Transform(trim)
  @IsString()
  @Length(2, 250)
  altText!: string
}

export class CreateAdminProductDto {
  @Transform(trim)
  @IsString()
  @Length(2, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string

  @Transform(trim)
  @IsString()
  @Length(3, 80)
  @Matches(/^[A-Z0-9][A-Z0-9-]+$/)
  sku!: string

  @Transform(trim)
  @IsString()
  @Length(2, 200)
  name!: string

  @Transform(trim)
  @IsString()
  @Length(10, 5000)
  description!: string

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  category!: string

  @Transform(trim)
  @IsString()
  @Length(2, 80)
  color!: string

  @Transform(trimArray)
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 30, { each: true })
  sizes!: string[]

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  price!: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  @IsOptional()
  compareAtPrice?: number | null

  @IsIn(editableStatuses)
  status!: (typeof editableStatuses)[number]

  @ValidateNested({ each: true })
  @Type(() => AdminProductImageDto)
  @IsArray()
  @ArrayMaxSize(8)
  images!: AdminProductImageDto[]

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  onHand!: number

  @Transform(trim)
  @IsString()
  @Length(3, 500)
  reason!: string
}

export class UpdateAdminProductDto {
  @Transform(trim)
  @IsString()
  @Length(2, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @IsOptional()
  slug?: string

  @Transform(trim)
  @IsString()
  @Length(3, 80)
  @Matches(/^[A-Z0-9][A-Z0-9-]+$/)
  @IsOptional()
  sku?: string

  @Transform(trim)
  @IsString()
  @Length(2, 200)
  @IsOptional()
  name?: string

  @Transform(trim)
  @IsString()
  @Length(10, 5000)
  @IsOptional()
  description?: string

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  @IsOptional()
  category?: string

  @Transform(trim)
  @IsString()
  @Length(2, 80)
  @IsOptional()
  color?: string

  @Transform(trimArray)
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 30, { each: true })
  @IsOptional()
  sizes?: string[]

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  @IsOptional()
  price?: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  @IsOptional()
  compareAtPrice?: number | null

  @IsIn(editableStatuses)
  @IsOptional()
  status?: (typeof editableStatuses)[number]

  @ValidateNested({ each: true })
  @Type(() => AdminProductImageDto)
  @IsArray()
  @ArrayMaxSize(8)
  @IsOptional()
  images?: AdminProductImageDto[]

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  @IsOptional()
  onHand?: number

  @Transform(trim)
  @IsString()
  @Length(3, 500)
  reason!: string
}

export class DeleteAdminProductDto {
  @Transform(trim)
  @IsString()
  @Length(3, 500)
  reason!: string
}
