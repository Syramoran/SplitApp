import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { BalanceService } from '../settlements/balance.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly balanceService: BalanceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear grupo con participantes solo por nombre' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mis grupos, con mi balance en cada uno' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.groupsService.findMine(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un grupo (miembros incluidos)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.findOne(user.userId, id);
  }

  @Get(':id/balance')
  @ApiOperation({
    summary: 'Balance del grupo: netos, deudas par a par explicadas y plan de cierre',
  })
  async balance(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.balanceService.assertMembership(id, user.userId);
    return this.balanceService.getGroupBalance(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Sumar un participante solo con el nombre (sin cuenta)' })
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(user.userId, id, dto);
  }
}
