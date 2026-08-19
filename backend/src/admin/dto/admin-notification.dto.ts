import { IsString, Length, Matches } from 'class-validator'

export class AdminNotificationActionDto {
  @IsString()
  @Length(8, 160)
  @Matches(/^(return|refund|email|stock):[A-Za-z0-9:_-]+$/)
  notificationKey!: string
}
