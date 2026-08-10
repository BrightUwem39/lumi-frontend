import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CatalogService } from './catalog.service.js'
import { CatalogQueryDto, CatalogSlugDto } from './dto/catalog-query.dto.js'

@ApiTags('catalog')
@Controller({ path: 'products', version: '1' })
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Lists published products' })
  list(@Query() query: CatalogQueryDto) {
    return this.catalog.list(query)
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'luna-silk-dress' })
  @ApiOperation({ summary: 'Returns a published product by slug' })
  findBySlug(@Param() params: CatalogSlugDto) {
    return this.catalog.findBySlug(params.slug)
  }
}
