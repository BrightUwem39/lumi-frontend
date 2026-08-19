import { Transform, Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsInt, IsString, IsUUID, Length, Max, Min, ValidateNested } from 'class-validator'

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value

class CustomerReturnItemDto {
  @IsUUID()
  orderItemId!: string

  @Type(() => Number) @IsInt() @Min(1) @Max(1_000_000)
  quantity!: number
}

export class CreateCustomerReturnDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CustomerReturnItemDto)
  items!: CustomerReturnItemDto[]

  @Transform(trim) @IsString() @Length(3, 500)
  reason!: string
}
