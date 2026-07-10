import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { ExpensesService } from './expenses.service';
import { RecurringService } from './recurring.service';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly recurringService: RecurringService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cargar un gasto (personal o grupal, mismo flujo)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Movimientos: personales + de mis grupos, mezclados' })
  list(@CurrentUser() user: AuthUser, @Query() filters: ListExpensesDto) {
    return this.expensesService.list(user.userId, filters);
  }

  @Get('recurring')
  @ApiOperation({ summary: 'Plantillas recurrentes activas (perfil)' })
  recurring(@CurrentUser() user: AuthUser) {
    return this.recurringService.listForUser(user.userId);
  }
}
