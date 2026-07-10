import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('settlements')
@ApiBearerAuth()
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un pago de cierre (transfe/efectivo/otro)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSettlementDto) {
    return this.settlementsService.create(user.userId, dto);
  }
}
