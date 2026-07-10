import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { ExpenseSplit } from '../expenses/entities/expense-split.entity';
import { GoalContribution } from '../goals/entities/goal-contribution.entity';
import { GoalsModule } from '../goals/goals.module';
import { SettlementsModule } from '../settlements/settlements.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseSplit, GoalContribution]),
    GoalsModule,
    SettlementsModule,
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
