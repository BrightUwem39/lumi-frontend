import { Transform } from 'class-transformer'
import { IsEmail, IsIn, IsString, Length, Matches, MaxLength } from 'class-validator'

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
