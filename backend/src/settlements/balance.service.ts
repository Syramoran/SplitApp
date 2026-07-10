import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { round2 } from '../common/numeric.transformer';
import { Expense } from '../expenses/entities/expense.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Settlement } from './entities/settlement.entity';
import { SimplifyService, Transfer } from './simplify.service';

export interface BalanceItem {
  kind: 'expense' | 'settlement';
  description: string;
  date: string;
  /** Positivo suma a la deuda del deudor, negativo la reduce. */
  amount: number;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface PairBalance {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  items: BalanceItem[];
}

export interface MemberBalance {
  memberId: string;
  displayName: string;
  avatarColor: string;
  userId: string | null;
  net: number;
}

export interface GroupBalance {
  groupId: string;
  members: MemberBalance[];
  /** Deudas netas par a par, cada una explicada por sus gastos (transparencia radical). */
  pairs: PairBalance[];
  /** Plan simplificado: mínima cantidad de transferencias para quedar a mano. */
  transfers: Transfer[];
  settled: boolean;
}

export interface SummaryItem {
  description: string;
  groupName: string;
  counterpartyName: string;
  amount: number;
  date: string;
  categoryIcon: string | null;
  categoryColor: string | null;
}

const EPSILON = 0.01;

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Settlement) private readonly settlementsRepo: Repository<Settlement>,
    @InjectRepository(GroupMember) private readonly membersRepo: Repository<GroupMember>,
    private readonly simplifyService: SimplifyService,
  ) {}

  /** Verifica que el usuario sea miembro del grupo y devuelve su membresía. */
  async assertMembership(groupId: string, userId: string): Promise<GroupMember> {
    const member = await this.membersRepo.findOneBy({ groupId, userId });
    if (!member) throw new ForbiddenException('No sos parte de este grupo');
    return member;
  }

  async getGroupBalance(groupId: string): Promise<GroupBalance> {
    const members = await this.membersRepo.find({ where: { groupId } });
    const expenses = await this.expensesRepo.find({
      where: { groupId },
      relations: { splits: true },
      order: { date: 'DESC' },
    });
    const settlements = await this.settlementsRepo.find({ where: { groupId } });

    return this.computeBalance(groupId, members, expenses, settlements);
  }

  /**
   * Cálculo puro del balance (sin DB) — testeado de forma aislada.
   * Nunca persistimos balances: siempre se derivan de gastos y pagos,
   * así el número y su explicación no pueden desincronizarse.
   */
  computeBalance(
    groupId: string,
    members: GroupMember[],
    expenses: Expense[],
    settlements: Settlement[],
  ): GroupBalance {
    // Deuda bruta por par (deudor -> acreedor), con los ítems que la componen
    const pairAgg = new Map<string, { amount: number; items: BalanceItem[] }>();
    const addToPair = (from: string, to: string, amount: number, item: BalanceItem): void => {
      const key = `${from}|${to}`;
      const entry = pairAgg.get(key) ?? { amount: 0, items: [] };
      entry.amount = round2(entry.amount + amount);
      entry.items.push(item);
      pairAgg.set(key, entry);
    };

    for (const expense of expenses) {
      if (!expense.paidBy) continue;
      for (const split of expense.splits ?? []) {
        if (split.memberId === expense.paidBy) continue;
        addToPair(split.memberId, expense.paidBy, split.amount, {
          kind: 'expense',
          description: expense.description,
          date: expense.date,
          amount: split.amount,
          categoryIcon: expense.category?.icon ?? null,
          categoryColor: expense.category?.color ?? null,
        });
      }
    }
    for (const settlement of settlements) {
      addToPair(settlement.fromMemberId, settlement.toMemberId, -settlement.amount, {
        kind: 'settlement',
        description: 'Pago registrado',
        date: settlement.confirmedAt.toISOString().slice(0, 10),
        amount: -settlement.amount,
        categoryIcon: null,
        categoryColor: null,
      });
    }

    // Neteo par a par: A→B contra B→A
    const pairs: PairBalance[] = [];
    const processed = new Set<string>();
    for (const key of pairAgg.keys()) {
      const [a, b] = key.split('|');
      const reverseKey = `${b}|${a}`;
      if (processed.has(key)) continue;
      processed.add(key);
      processed.add(reverseKey);

      const forward = pairAgg.get(key) ?? { amount: 0, items: [] };
      const reverse = pairAgg.get(reverseKey) ?? { amount: 0, items: [] };
      const net = round2(forward.amount - reverse.amount);
      if (Math.abs(net) < EPSILON) continue;

      const invert = (items: BalanceItem[]): BalanceItem[] =>
        items.map((i) => ({ ...i, amount: round2(-i.amount) }));

      if (net > 0) {
        pairs.push({
          fromMemberId: a,
          toMemberId: b,
          amount: net,
          items: [...forward.items, ...invert(reverse.items)],
        });
      } else {
        pairs.push({
          fromMemberId: b,
          toMemberId: a,
          amount: -net,
          items: [...reverse.items, ...invert(forward.items)],
        });
      }
    }

    // Neto por miembro: lo que pagó menos lo que le corresponde, ± pagos de cierre
    const nets = new Map<string, number>(members.map((m) => [m.id, 0]));
    const addNet = (memberId: string, delta: number): void => {
      if (!nets.has(memberId)) return;
      nets.set(memberId, round2((nets.get(memberId) ?? 0) + delta));
    };
    for (const expense of expenses) {
      if (!expense.paidBy) continue;
      addNet(expense.paidBy, expense.amount);
      for (const split of expense.splits ?? []) addNet(split.memberId, -split.amount);
    }
    for (const settlement of settlements) {
      addNet(settlement.fromMemberId, settlement.amount);
      addNet(settlement.toMemberId, -settlement.amount);
    }

    const memberBalances: MemberBalance[] = members.map((m) => ({
      memberId: m.id,
      displayName: m.displayName,
      avatarColor: m.avatarColor,
      userId: m.userId,
      net: nets.get(m.id) ?? 0,
    }));

    const transfers = this.simplifyService.simplify(
      memberBalances.map((m) => ({ memberId: m.memberId, net: m.net })),
    );

    return {
      groupId,
      members: memberBalances,
      pairs,
      transfers,
      settled: transfers.length === 0,
    };
  }

  /** Neto del usuario en un grupo (para las cards de la lista de grupos). */
  async getMyNet(groupId: string, userId: string): Promise<number> {
    const balance = await this.getGroupBalance(groupId);
    const mine = balance.members.find((m) => m.userId === userId);
    return mine?.net ?? 0;
  }

  /**
   * Resumen global para el home: "te deben" y "te toca poner",
   * cada total explicado por los ítems que lo componen.
   */
  async getUserSummary(userId: string): Promise<{
    owedToMe: { total: number; items: SummaryItem[] };
    iOwe: { total: number; items: SummaryItem[] };
  }> {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: { group: true },
    });

    const owedItems: SummaryItem[] = [];
    const oweItems: SummaryItem[] = [];
    let owedTotal = 0;
    let oweTotal = 0;

    for (const membership of memberships) {
      const balance = await this.getGroupBalance(membership.groupId);
      const nameOf = (memberId: string): string =>
        balance.members.find((m) => m.memberId === memberId)?.displayName ?? '—';

      for (const pair of balance.pairs) {
        const toItems = (counterparty: string): SummaryItem[] =>
          pair.items.map((item) => ({
            description: item.description,
            groupName: membership.group?.name ?? '—',
            counterpartyName: counterparty,
            amount: item.amount,
            date: item.date,
            categoryIcon: item.categoryIcon,
            categoryColor: item.categoryColor,
          }));

        if (pair.toMemberId === membership.id) {
          owedTotal = round2(owedTotal + pair.amount);
          owedItems.push(...toItems(nameOf(pair.fromMemberId)));
        } else if (pair.fromMemberId === membership.id) {
          oweTotal = round2(oweTotal + pair.amount);
          oweItems.push(...toItems(nameOf(pair.toMemberId)));
        }
      }
    }

    return {
      owedToMe: { total: owedTotal, items: owedItems },
      iOwe: { total: oweTotal, items: oweItems },
    };
  }
}
