import { Transform, Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { ReturnStatus } from '../../generated/prisma/client.js'

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value

export class AdminReturnParamsDto {
  @IsUUID()
  returnId!: string
}

class CreateReturnItemDto {
  @IsUUID()
  orderItemId!: string

  @Type(() => Number) @IsInt() @Min(1) @Max(1_000_000)
  quantity!: number
}

export class CreateAdminReturnDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateReturnItemDto)
  items!: CreateReturnItemDto[]

  @Transform(trim) @IsString() @Length(3, 500)
  reason!: string
}

export class UpdateAdminReturnStatusDto {
  @IsIn([ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.RECEIVED])
  status!: 'APPROVED' | 'REJECTED' | 'RECEIVED'

  @Transform(trim) @IsString() @Length(3, 500)
  resolutionNote!: string
}

class RestockReturnItemDto {
  @IsUUID()
  returnItemId!: string

  @Type(() => Number) @IsInt() @Min(0) @Max(1_000_000)
  quantity!: number
}

export class CompleteAdminReturnDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => RestockReturnItemDto)
  items!: RestockReturnItemDto[]

  @Transform(trim) @IsString() @Length(3, 500)
  resolutionNote!: string
}
