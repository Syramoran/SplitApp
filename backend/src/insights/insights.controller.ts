import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@ApiBearerAuth()
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen del home: gastado del mes, te deben y te toca poner (explicados)',
  })
  summary(@CurrentUser() user: AuthUser) {
    return this.insightsService.summary(user.userId);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Tu mes en claro: categorías, fijos/variables, ahorro, metas' })
  @ApiQuery({ name: 'month', required: false, example: '2026-07' })
  monthly(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.insightsService.monthly(user.userId, month);
  }
}
