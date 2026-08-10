import { Transform, Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

const trimOptionalText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value

export class CartProductParamsDto {
  @IsString()
  @Length(1, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  productSlug!: string
}

export class SetCartItemDto {
  @ApiProperty({ minimum: 1, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number

  @ApiPropertyOptional({ description: 'Defaults to the first available product size' })
  @Transform(trimOptionalText)
  @IsString()
  @Length(1, 30)
  @IsOptional()
  size?: string
}
