import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({
    summary: 'Enviar recordatorio neutral: lo manda la app, nunca la persona',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Recordatorios enviados en un grupo' })
  @ApiQuery({ name: 'groupId', required: true })
  list(@CurrentUser() user: AuthUser, @Query('groupId') groupId: string) {
    return this.remindersService.listForGroup(user.userId, groupId);
  }
}
