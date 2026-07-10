import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { round2 } from '../common/numeric.transformer';
import { Expense } from '../expenses/entities/expense.entity';
import { ExpenseSplit } from '../expenses/entities/expense-split.entity';
import { GoalContribution } from '../goals/entities/goal-contribution.entity';
import { GoalsService, GoalWithProgress } from '../goals/goals.service';
import { BalanceService, SummaryItem } from '../settlements/balance.service';

interface SpendRow {
  amount: number;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  isFixed: boolean;
}

export interface CategoryTotal {
  name: string;
  icon: string;
  color: string;
  total: number;
}

export interface GoalInsight extends GoalWithProgress {
  /** Fecha estimada de llegada al objetivo, al ritmo de aporte actual. */
  projectedDate: string | null;
}

export interface MonthlyInsights {
  month: string;
  monthTotal: number;
  prevMonthTotal: number;
  /** Variación contra el mes anterior, en % (negativo = gastaste menos). */
  vsPrevMonthPct: number | null;
  categories: CategoryTotal[];
  fixedTotal: number;
  variableTotal: number;
  savings: { contributed: number; rate: number };
  goals: GoalInsight[];
}

export interface HomeSummary {
  month: string;
  monthTotal: number;
  owedToMe: { total: number; items: SummaryItem[] };
  iOwe: { total: number; items: SummaryItem[] };
}

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(ExpenseSplit) private readonly splitsRepo: Repository<ExpenseSplit>,
    @InjectRepository(GoalContribution)
    private readonly contributionsRepo: Repository<GoalContribution>,
    private readonly balanceService: BalanceService,
    private readonly goalsService: GoalsService,
  ) {}

  async summary(userId: string): Promise<HomeSummary> {
    const month = new Date().toISOString().slice(0, 7);
    const [monthTotal, balances] = await Promise.all([
      this.monthTotal(userId, month),
      this.balanceService.getUserSummary(userId),
    ]);
    return { month, monthTotal, ...balances };
  }

  async monthly(userId: string, monthParam?: string): Promise<MonthlyInsights> {
    const month = monthParam ?? new Date().toISOString().slice(0, 7);
    const prevMonth = this.previousMonth(month);

    const [rows, prevMonthTotal, contributed, goals] = await Promise.all([
      this.fetchSpendRows(userId, month),
      this.monthTotal(userId, prevMonth),
      this.contributedInMonth(userId, month),
      this.goalsService.findMine(userId),
    ]);

    const monthTotal = round2(rows.reduce((acc, r) => acc + r.amount, 0));

    const byCategory = new Map<string, CategoryTotal>();
    let fixedTotal = 0;
    for (const row of rows) {
      if (row.isFixed) fixedTotal = round2(fixedTotal + row.amount);
      const name = row.categoryName ?? 'Otros';
      const entry = byCategory.get(name) ?? {
        name,
        icon: row.categoryIcon ?? 'coin',
        color: row.categoryColor ?? 'butter',
        total: 0,
      };
      entry.total = round2(entry.total + row.amount);
      byCategory.set(name, entry);
    }

    const goalInsights = await Promise.all(
      goals.map(async (goal) => ({ ...goal, projectedDate: await this.projectGoal(goal) })),
    );

    return {
      month,
      monthTotal,
      prevMonthTotal,
      vsPrevMonthPct:
        prevMonthTotal > 0 ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100) : null,
      categories: [...byCategory.values()].sort((a, b) => b.total - a.total),
      fixedTotal,
      variableTotal: round2(monthTotal - fixedTotal),
      savings: {
        contributed,
        rate:
          contributed + monthTotal > 0
            ? Math.round((contributed / (contributed + monthTotal)) * 100)
            : 0,
      },
      goals: goalInsights,
    };
  }

  /**
   * Lo que gastó el usuario en el mes: sus gastos personales completos
   * más SU PARTE de los gastos grupales (no el total del grupo).
   */
  private async monthTotal(userId: string, month: string): Promise<number> {
    const rows = await this.fetchSpendRows(userId, month);
    return round2(rows.reduce((acc, r) => acc + r.amount, 0));
  }

  private async fetchSpendRows(userId: string, month: string): Promise<SpendRow[]> {
    const personal = await this.expensesRepo
      .createQueryBuilder('expense')
      .leftJoin('expense.category', 'category')
      .select('expense.amount', 'amount')
      .addSelect('category.name', 'categoryName')
      .addSelect('category.icon', 'categoryIcon')
      .addSelect('category.color', 'categoryColor')
      .addSelect('COALESCE(category.is_fixed, false) OR expense.is_recurring', 'isFixed')
      .where('expense.group_id IS NULL')
      .andWhere('expense.created_by = :userId', { userId })
      .andWhere("to_char(expense.date, 'YYYY-MM') = :month", { month })
      .getRawMany<{ amount: string; categoryName: string | null; categoryIcon: string | null; categoryColor: string | null; isFixed: boolean }>();

    const shared = await this.splitsRepo
      .createQueryBuilder('split')
      .innerJoin('split.expense', 'expense')
      .innerJoin('split.member', 'member')
      .leftJoin('expense.category', 'category')
      .select('split.amount', 'amount')
      .addSelect('category.name', 'categoryName')
      .addSelect('category.icon', 'categoryIcon')
      .addSelect('category.color', 'categoryColor')
      .addSelect('COALESCE(category.is_fixed, false) OR expense.is_recurring', 'isFixed')
      .where('member.user_id = :userId', { userId })
      .andWhere("to_char(expense.date, 'YYYY-MM') = :month", { month })
      .getRawMany<{ amount: string; categoryName: string | null; categoryIcon: string | null; categoryColor: string | null; isFixed: boolean }>();

    return [...personal, ...shared].map((r) => ({
      amount: parseFloat(r.amount),
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
      isFixed: Boolean(r.isFixed),
    }));
  }

  private async contributedInMonth(userId: string, month: string): Promise<number> {
    const result = await this.contributionsRepo
      .createQueryBuilder('contribution')
      .select('COALESCE(SUM(contribution.amount), 0)', 'sum')
      .where('contribution.user_id = :userId', { userId })
      .andWhere("to_char(contribution.date, 'YYYY-MM') = :month", { month })
      .getRawOne<{ sum: string }>();
    return round2(parseFloat(result?.sum ?? '0'));
  }

  /** "A este ritmo llegás en noviembre": proyección al ritmo de aporte actual. */
  private async projectGoal(goal: GoalWithProgress): Promise<string | null> {
    if (goal.saved <= 0 || goal.saved >= goal.targetAmount) return null;

    const first = await this.contributionsRepo.findOne({
      where: { goalId: goal.id },
      order: { date: 'ASC' },
    });
    if (!first) return null;

    const start = new Date(first.date);
    const now = new Date();
    const monthsElapsed = Math.max(
      1,
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1,
    );
    const pace = goal.saved / monthsElapsed;
    if (pace <= 0) return null;

    const monthsLeft = Math.ceil((goal.targetAmount - goal.saved) / pace);
    const projected = new Date(now.getFullYear(), now.getMonth() + monthsLeft, 1);
    return projected.toISOString().slice(0, 10);
  }

  private previousMonth(month: string): string {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
