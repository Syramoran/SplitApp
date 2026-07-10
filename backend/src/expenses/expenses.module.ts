import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { Expense } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';
import { RecurringExpense } from './entities/recurring-expense.entity';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { RecurringService } from './recurring.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      ExpenseSplit,
      RecurringExpense,
      Category,
      Group,
      GroupMember,
    ]),
  ],
  controllers: [ExpensesController, CategoriesController],
  providers: [ExpensesService, RecurringService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
