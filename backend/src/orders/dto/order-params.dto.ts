import { IsString, Length, Matches } from 'class-validator'

export class OrderNumberParamsDto {
  @IsString()
  @Length(10, 40)
  @Matches(/^LM-[0-9]{4}-[A-F0-9]{12}$/)
  orderNumber!: string
}
