import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';

type MockRepo<T extends object = object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const makeGroup = (): Group =>
  ({
    id: 'g1',
    name: 'Depto Palermo',
    currency: 'ARS',
    defaultSplitType: 'equal',
    members: [
      { id: 'm-agos', userId: 'u-agos', displayName: 'Agos', splitPercent: null },
      { id: 'm-tomi', userId: null, displayName: 'Tomi', splitPercent: null },
      { id: 'm-fede', userId: null, displayName: 'Fede', splitPercent: null },
    ] as GroupMember[],
  }) as Group;

describe('ExpensesService (crear gasto)', () => {
  let service: ExpensesService;
  let expensesRepo: MockRepo<Expense>;
  let groupsRepo: MockRepo<Group>;

  beforeEach(() => {
    expensesRepo = {
      create: jest.fn((dto: object) => dto as Expense),
      save: jest.fn((expense: Expense) => Promise.resolve({ ...expense, id: 'e1' })),
    };
    groupsRepo = { findOne: jest.fn() };
    service = new ExpensesService(
      expensesRepo as never,
      groupsRepo as never,
      {} as never,
    );
  });

  it('crea un gasto personal sin splits (mismo flujo que el grupal)', async () => {
    const expense = await service.create('u-agos', {
      amount: 4800,
      description: 'Café La Noire',
      categoryId: 2,
    });

    expect(expense.groupId).toBeNull();
    expect(expense.paidBy).toBeNull();
    expect(expense.createdBy).toBe('u-agos');
    expect(expensesRepo.save).toHaveBeenCalled();
  });

  it('divide en partes iguales entre todos los miembros por defecto', async () => {
    groupsRepo.findOne!.mockResolvedValue(makeGroup());

    const expense = await service.create('u-agos', {
      amount: 24600,
      description: 'Súper Coto',
      groupId: 'g1',
      paidByMemberId: 'm-agos',
    });

    expect(expense.splits).toHaveLength(3);
    expect(expense.splits.map((s) => s.amount)).toEqual([8200, 8200, 8200]);
  });

  it('quien pagó absorbe los centavos de redondeo: las partes siempre suman el total', async () => {
    groupsRepo.findOne!.mockResolvedValue(makeGroup());

    const expense = await service.create('u-agos', {
      amount: 100,
      description: 'Birras',
      groupId: 'g1',
      paidByMemberId: 'm-agos',
    });

    const sum = expense.splits.reduce((acc, s) => acc + s.amount, 0);
    expect(sum).toBeCloseTo(100, 2);
    const payerSplit = expense.splits.find((s) => s.memberId === 'm-agos');
    expect(payerSplit?.amount).toBeCloseTo(33.34, 2);
  });

  it('divide por porcentajes (pareja 60/40)', async () => {
    groupsRepo.findOne!.mockResolvedValue(makeGroup());

    const expense = await service.create('u-agos', {
      amount: 30000,
      description: 'Cena',
      groupId: 'g1',
      paidByMemberId: 'm-agos',
      splitType: 'percent',
      splits: [
        { memberId: 'm-agos', weight: 60 },
        { memberId: 'm-tomi', weight: 40 },
      ],
    });

    expect(expense.splits.find((s) => s.memberId === 'm-agos')?.amount).toBe(18000);
    expect(expense.splits.find((s) => s.memberId === 'm-tomi')?.amount).toBe(12000);
  });

  it('rechaza divisiones exactas que no suman el total', async () => {
    groupsRepo.findOne!.mockResolvedValue(makeGroup());

    await expect(
      service.create('u-agos', {
        amount: 24600,
        description: 'Súper',
        groupId: 'g1',
        paidByMemberId: 'm-agos',
        splitType: 'exact',
        splits: [
          { memberId: 'm-agos', amount: 10000 },
          { memberId: 'm-fede', amount: 8200 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza cargar gastos en grupos ajenos', async () => {
    groupsRepo.findOne!.mockResolvedValue(makeGroup());

    await expect(
      service.create('u-intruso', { amount: 100, description: 'x', groupId: 'g1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza partes de personas que no son del grupo', async () => {
    groupsRepo.findOne!.mockResolvedValue(makeGroup());

    await expect(
      service.create('u-agos', {
        amount: 100,
        description: 'x',
        groupId: 'g1',
        splits: [{ memberId: 'm-extraño', weight: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
