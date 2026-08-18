import { Transform } from 'class-transformer'
import { IsBoolean, IsEmail, IsIn, IsInt, IsNumber, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value
const upper = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value
const email = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value

export class UpdateStoreProfileDto {
  @Transform(trim) @IsString() @Length(2, 100) storeName!: string
  @Transform(trim) @IsString() @Length(10, 200) tagline!: string
  @Transform(email) @IsEmail() @MaxLength(320) supportEmail!: string
  @Transform(trim) @IsString() @Length(5, 32) supportPhone!: string
  @Transform(trim) @IsString() @Length(2, 250) addressLine!: string
  @Transform(trim) @IsString() @Length(2, 100) city!: string
  @Transform(upper) @Matches(/^[A-Z]{2}$/) countryCode!: string
  @Transform(upper) @IsIn(['NGN']) defaultCurrency!: string
  @Transform(trim) @IsString() @Length(3, 500) reason!: string
}

export class UpdateShippingSettingsDto {
  @IsBoolean()
  shippingEnabled!: boolean

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1_000_000_000)
  shippingFee!: number

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1_000_000_000)
  freeShippingThreshold!: number

  @Type(() => Number) @IsInt() @Min(1) @Max(60)
  deliveryMinDays!: number

  @Type(() => Number) @IsInt() @Min(1) @Max(90)
  deliveryMaxDays!: number

  @Transform(trim) @IsString() @Length(3, 500)
  reason!: string
}

export class UpdateTaxSettingsDto {
  @IsBoolean()
  taxEnabled!: boolean

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100)
  taxRate!: number

  @Transform(trim) @IsString() @Length(2, 40)
  taxLabel!: string

  @IsBoolean()
  pricesIncludeTax!: boolean

  @Transform(trim) @IsString() @Length(3, 500)
  reason!: string
}
