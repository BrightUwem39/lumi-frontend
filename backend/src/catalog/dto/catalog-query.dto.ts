import { Transform, Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

const trimOptionalText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value

export const catalogSortValues = ['newest', 'price-asc', 'price-desc', 'name'] as const
export type CatalogSort = (typeof catalogSortValues)[number]

export class CatalogQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit = 24

  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trimOptionalText)
  @IsString()
  @Length(1, 100)
  @IsOptional()
  category?: string

  @ApiPropertyOptional({ description: 'Searches public product names and descriptions' })
  @Transform(trimOptionalText)
  @IsString()
  @Length(2, 100)
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ enum: catalogSortValues, default: 'newest' })
  @IsIn(catalogSortValues)
  @IsOptional()
  sort: CatalogSort = 'newest'
}

export class CatalogSlugDto {
  @IsString()
  @Length(1, 160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string
}
