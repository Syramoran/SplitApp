import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { GoalContribution } from './entities/goal-contribution.entity';
import { SavingsGoal } from './entities/savings-goal.entity';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [TypeOrmModule.forFeature([SavingsGoal, GoalContribution, GroupMember])],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
