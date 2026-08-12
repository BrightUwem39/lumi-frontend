import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value

const trimText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

export class RegisterDto {
  @ApiProperty({ example: 'customer@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string

  @ApiProperty({ minLength: 8, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'Password must contain at least one letter.' })
  @Matches(/\d/, { message: 'Password must contain at least one number.' })
  password!: string

  @ApiProperty({ example: 'Amara' })
  @Transform(trimText)
  @IsString()
  @Length(1, 100)
  firstName!: string

  @ApiProperty({ example: 'Okafor' })
  @Transform(trimText)
  @IsString()
  @Length(1, 100)
  lastName!: string
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string

  @IsString()
  @MaxLength(128)
  password!: string
}

export class EmailDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string
}

export class TokenDto {
  @IsString()
  @Length(43, 128)
  token!: string
}

export class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'Password must contain at least one letter.' })
  @Matches(/\d/, { message: 'Password must contain at least one number.' })
  newPassword!: string
}
