import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { round2 } from '../common/numeric.transformer';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Group, SplitType } from '../groups/entities/group.entity';
import { CreateExpenseDto, SplitEntryDto } from './dto/create-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { Expense } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';

export interface ComputedSplit {
  memberId: string;
  amount: number;
  weight: number | null;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember) private readonly membersRepo: Repository<GroupMember>,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    if (!dto.groupId) {
      // Gasto personal: mismo flujo, sin splits
      return this.expensesRepo.save(
        this.expensesRepo.create({
          description: dto.description,
          amount: dto.amount,
          categoryId: dto.categoryId ?? null,
          groupId: null,
          paidBy: null,
          createdBy: userId,
          splitType: null,
          date: dto.date ?? new Date().toISOString().slice(0, 10),
        }),
      );
    }

    const group = await this.groupsRepo.findOne({
      where: { id: dto.groupId },
      relations: { members: true },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');

    const me = group.members.find((m) => m.userId === userId);
    if (!me) throw new ForbiddenException('No sos parte de este grupo');

    const payerId = dto.paidByMemberId ?? me.id;
    if (!group.members.some((m) => m.id === payerId)) {
      throw new BadRequestException('Quien pagó debe ser parte del grupo');
    }

    const splitType: SplitType = dto.splitType ?? group.defaultSplitType;
    const entries = this.resolveEntries(group, splitType, dto.splits);
    const computed = this.computeSplits(dto.amount, splitType, entries, payerId);

    const expense = this.expensesRepo.create({
      description: dto.description,
      amount: dto.amount,
      currency: group.currency,
      categoryId: dto.categoryId ?? null,
      groupId: group.id,
      paidBy: payerId,
      createdBy: userId,
      splitType,
      date: dto.date ?? new Date().toISOString().slice(0, 10),
      splits: computed.map((s) => ({ ...new ExpenseSplit(), ...s })),
    });
    return this.expensesRepo.save(expense);
  }

  /**
   * Sin splits explícitos, la división sale de la config del grupo:
   * iguales entre todos, o proporcional (pareja 60/40) si el grupo lo define.
   */
  private resolveEntries(
    group: Group,
    splitType: SplitType,
    splits?: SplitEntryDto[],
  ): SplitEntryDto[] {
    if (splits && splits.length > 0) {
      const memberIds = new Set(group.members.map((m) => m.id));
      for (const entry of splits) {
        if (!memberIds.has(entry.memberId)) {
          throw new BadRequestException('Todas las partes deben ser de miembros del grupo');
        }
      }
      return splits;
    }
    return group.members.map((m) => ({
      memberId: m.id,
      weight: splitType === 'percent' ? (m.splitPercent ?? 100 / group.members.length) : 1,
    }));
  }

  /**
   * Reparte el total según el tipo de división. El redondeo a 2 decimales
   * puede dejar centavos sueltos: los absorbe quien pagó, así la suma de
   * las partes siempre es exactamente el total.
   */
  computeSplits(
    total: number,
    splitType: SplitType,
    entries: SplitEntryDto[],
    payerId: string,
  ): ComputedSplit[] {
    if (entries.length === 0) throw new BadRequestException('El gasto necesita al menos una parte');

    let result: ComputedSplit[];

    if (splitType === 'exact') {
      result = entries.map((e) => {
        if (e.amount == null) {
          throw new BadRequestException('División exacta: cada parte necesita un monto');
        }
        return { memberId: e.memberId, amount: round2(e.amount), weight: null };
      });
      const sum = round2(result.reduce((acc, s) => acc + s.amount, 0));
      if (Math.abs(sum - total) > 0.01) {
        throw new BadRequestException(
          `Las partes suman $${sum} pero el gasto es de $${total}`,
        );
      }
      return result;
    }

    if (splitType === 'equal') {
      const share = round2(total / entries.length);
      result = entries.map((e) => ({ memberId: e.memberId, amount: share, weight: 1 }));
    } else {
      // shares y percent: proporcional al peso
      const totalWeight = entries.reduce((acc, e) => acc + (e.weight ?? 0), 0);
      if (totalWeight <= 0) {
        throw new BadRequestException('La división necesita pesos mayores a cero');
      }
      result = entries.map((e) => ({
        memberId: e.memberId,
        amount: round2((total * (e.weight ?? 0)) / totalWeight),
        weight: e.weight ?? 0,
      }));
    }

    // Ajuste de redondeo sobre quien pagó (o la primera parte)
    const sum = round2(result.reduce((acc, s) => acc + s.amount, 0));
    const remainder = round2(total - sum);
    if (remainder !== 0) {
      const target = result.find((s) => s.memberId === payerId) ?? result[0];
      target.amount = round2(target.amount + remainder);
    }
    return result;
  }

  /** Movimientos del usuario: personales + de sus grupos, mezclados (home). */
  async list(userId: string, filters: ListExpensesDto): Promise<Expense[]> {
    const query = this.expensesRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.group', 'group')
      .leftJoinAndSelect('expense.paidByMember', 'paidByMember')
      .leftJoinAndSelect('expense.splits', 'splits')
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .take(filters.limit ?? 20);

    if (filters.groupId) {
      query.where('expense.group_id = :groupId', { groupId: filters.groupId });
      query.andWhere(
        'EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expense.group_id AND gm.user_id = :userId)',
        { userId },
      );
    } else {
      query.where(
        new Brackets((qb) => {
          qb.where('expense.group_id IS NULL AND expense.created_by = :userId', { userId }).orWhere(
            'EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = expense.group_id AND gm.user_id = :userId)',
            { userId },
          );
        }),
      );
    }

    if (filters.month) {
      query.andWhere("to_char(expense.date, 'YYYY-MM') = :month", { month: filters.month });
    }

    return query.getMany();
  }
}
