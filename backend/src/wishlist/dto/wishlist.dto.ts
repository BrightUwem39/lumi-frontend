import { IsString, Length, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class WishlistProductDto {
  @ApiProperty({ example: 'luna-silk-dress' })
  @IsString()
  @Length(1, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  productSlug!: string
}

export class WishlistProductParamsDto {
  @IsString()
  @Length(1, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  productSlug!: string
}
