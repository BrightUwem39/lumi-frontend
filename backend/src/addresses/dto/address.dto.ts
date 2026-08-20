import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value
const optionalTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value
const countryCode = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value

export class AddressParamsDto {
  @IsUUID()
  addressId!: string
}

export class CreateAddressDto {
  @Transform(optionalTrim) @IsString() @MaxLength(50) @IsOptional() label?: string
  @Transform(trim) @IsString() @Length(1, 100) firstName!: string
  @Transform(trim) @IsString() @Length(1, 100) lastName!: string
  @Transform(trim) @IsString() @Length(5, 32) phone!: string
  @Transform(trim) @IsString() @Length(1, 200) line1!: string
  @Transform(optionalTrim) @IsString() @MaxLength(200) @IsOptional() line2?: string
  @Transform(trim) @IsString() @Length(1, 100) city!: string
  @Transform(trim) @IsString() @Length(1, 100) region!: string
  @Transform(optionalTrim) @IsString() @MaxLength(32) @IsOptional() postalCode?: string
  @Transform(countryCode) @IsString() @Matches(/^[A-Z]{2}$/) country!: string
  @IsBoolean() @IsOptional() isDefault?: boolean
}

export class UpdateAddressDto {
  @Transform(optionalTrim) @IsString() @MaxLength(50) @IsOptional() label?: string
  @Transform(trim) @IsString() @Length(1, 100) @IsOptional() firstName?: string
  @Transform(trim) @IsString() @Length(1, 100) @IsOptional() lastName?: string
  @Transform(trim) @IsString() @Length(5, 32) @IsOptional() phone?: string
  @Transform(trim) @IsString() @Length(1, 200) @IsOptional() line1?: string
  @Transform(optionalTrim) @IsString() @MaxLength(200) @IsOptional() line2?: string
  @Transform(trim) @IsString() @Length(1, 100) @IsOptional() city?: string
  @Transform(trim) @IsString() @Length(1, 100) @IsOptional() region?: string
  @Transform(optionalTrim) @IsString() @MaxLength(32) @IsOptional() postalCode?: string
  @Transform(countryCode) @IsString() @Matches(/^[A-Z]{2}$/) @IsOptional() country?: string
  @IsBoolean() @IsOptional() isDefault?: boolean
}
