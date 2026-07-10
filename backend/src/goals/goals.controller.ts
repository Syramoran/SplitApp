import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ContributeDto } from './dto/contribute.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Mis metas de ahorro con progreso' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.goalsService.findMine(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear meta de ahorro (personal o compartida con un grupo)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una meta: cada aporte que la compone' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.findOne(user.userId, id);
  }

  @Post(':id/contributions')
  @ApiOperation({ summary: 'Registrar un aporte (la plata vive donde vos elijas)' })
  contribute(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ContributeDto,
  ) {
    return this.goalsService.contribute(user.userId, id, dto);
  }
}
