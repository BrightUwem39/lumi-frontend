import { Transform } from 'class-transformer'
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value
const email = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value
const couponCode = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() || undefined : value

export class ValidateCouponDto {
  @Transform(couponCode)
  @IsString()
  @Length(3, 64)
  @Matches(/^[A-Z0-9][A-Z0-9_-]+$/)
  couponCode!: string
}

export class CreateOrderDto {
  @Transform(email) @IsEmail() @MaxLength(320) email!: string
  @Transform(trim) @IsString() @Length(1, 100) firstName!: string
  @Transform(trim) @IsString() @Length(1, 100) lastName!: string
  @Transform(trim) @IsString() @Length(5, 32) phone!: string
  @Transform(trim) @IsString() @Length(1, 200) line1!: string
  @Transform(trim) @IsString() @MaxLength(200) @IsOptional() line2?: string
  @Transform(trim) @IsString() @Length(1, 100) city!: string
  @Transform(trim) @IsString() @Length(1, 100) region!: string
  @Transform(trim) @IsString() @MaxLength(32) @IsOptional() postalCode?: string

  @ApiProperty({ example: 'NG', minLength: 2, maxLength: 2 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  country!: string

  @Transform(couponCode)
  @IsString()
  @Length(3, 64)
  @Matches(/^[A-Z0-9][A-Z0-9_-]+$/)
  @IsOptional()
  couponCode?: string
}
