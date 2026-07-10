import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Expense } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';
import { RecurringExpense } from './entities/recurring-expense.entity';
import { ExpensesService } from './expenses.service';

/**
 * Materializa las plantillas recurrentes ("alquiler e internet se cargan
 * solos cada mes"). Corre todos los días a las 03:00 y carga las plantillas
 * cuyo día ya pasó y todavía no corrieron este mes.
 */
@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    @InjectRepository(RecurringExpense)
    private readonly recurringRepo: Repository<RecurringExpense>,
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(GroupMember) private readonly membersRepo: Repository<GroupMember>,
    private readonly expensesService: ExpensesService,
  ) {}

  async listForUser(userId: string): Promise<RecurringExpense[]> {
    return this.recurringRepo
      .createQueryBuilder('recurring')
      .leftJoinAndSelect('recurring.group', 'group')
      .where('recurring.created_by = :userId', { userId })
      .orWhere(
        'EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = recurring.group_id AND gm.user_id = :userId)',
        { userId },
      )
      .getMany();
  }

  @Cron('0 3 * * *')
  async materializeDue(): Promise<void> {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const templates = await this.recurringRepo.findBy({ active: true });

    for (const template of templates) {
      const alreadyRan = template.lastRun?.slice(0, 7) === currentMonth;
      if (alreadyRan || template.dayOfMonth > today.getDate()) continue;

      try {
        await this.materialize(template, currentMonth);
      } catch (error) {
        this.logger.error(`No se pudo materializar "${template.description}"`, error);
      }
    }
  }

  private async materialize(template: RecurringExpense, month: string): Promise<void> {
    const day = String(template.dayOfMonth).padStart(2, '0');
    const date = `${month}-${day}`;

    const expense = this.expensesRepo.create({
      description: template.description,
      amount: template.amount,
      categoryId: template.categoryId,
      groupId: template.groupId,
      paidBy: template.paidBy,
      createdBy: template.createdBy,
      splitType: template.groupId ? template.splitType : null,
      isRecurring: true,
      date,
    });

    if (template.groupId && template.paidBy) {
      const members = await this.membersRepo.findBy({ groupId: template.groupId });
      const computed = this.expensesService.computeSplits(
        template.amount,
        template.splitType,
        members.map((m) => ({
          memberId: m.id,
          weight: template.splitType === 'percent' ? (m.splitPercent ?? 1) : 1,
        })),
        template.paidBy,
      );
      expense.splits = computed.map((s) => ({ ...new ExpenseSplit(), ...s }));
    }

    await this.expensesRepo.save(expense);
    template.lastRun = date;
    await this.recurringRepo.save(template);
    this.logger.log(`Recurrente cargado: ${template.description} (${date})`);
  }
}
