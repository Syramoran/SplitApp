import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { suggestCategoryName } from './category-suggest';
import { Category } from './entities/category.entity';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectRepository(Category) private readonly categoriesRepo: Repository<Category>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de categorías' })
  findAll() {
    return this.categoriesRepo.find({ order: { id: 'ASC' } });
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Categoría sugerida sola a partir de la descripción' })
  @ApiQuery({ name: 'q', example: 'Súper Día' })
  async suggest(@Query('q') q = ''): Promise<{ category: Category | null }> {
    const name = suggestCategoryName(q);
    if (!name) return { category: null };
    return { category: await this.categoriesRepo.findOneBy({ name }) };
  }
}
