import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { BalanceService } from './balance.service';
import { Settlement } from './entities/settlement.entity';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { SimplifyService } from './simplify.service';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, Expense, GroupMember])],
  controllers: [SettlementsController],
  providers: [SettlementsService, BalanceService, SimplifyService],
  exports: [BalanceService, SimplifyService],
})
export class SettlementsModule {}
