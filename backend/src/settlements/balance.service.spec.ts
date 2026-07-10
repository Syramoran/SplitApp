import { Expense } from '../expenses/entities/expense.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { BalanceService } from './balance.service';
import { Settlement } from './entities/settlement.entity';
import { SimplifyService } from './simplify.service';

const member = (id: string, name: string): GroupMember =>
  ({ id, displayName: name, avatarColor: 'lilac', userId: null, groupId: 'g1' }) as GroupMember;

const expense = (
  paidBy: string,
  amount: number,
  splits: Array<[string, number]>,
  description = 'Gasto',
): Expense =>
  ({
    description,
    amount,
    paidBy,
    date: '2026-07-01',
    category: null,
    splits: splits.map(([memberId, splitAmount]) => ({ memberId, amount: splitAmount })),
  }) as Expense;

const settlement = (from: string, to: string, amount: number): Settlement =>
  ({ fromMemberId: from, toMemberId: to, amount, confirmedAt: new Date('2026-07-02') }) as Settlement;

describe('BalanceService.computeBalance (balances explicables)', () => {
  let service: BalanceService;

  beforeEach(() => {
    service = new BalanceService(
      null as never,
      null as never,
      null as never,
      new SimplifyService(),
    );
  });

  const members = [member('agos', 'Agos'), member('tomi', 'Tomi'), member('fede', 'Fede')];

  it('con un gasto pagado por una persona, los demás le deben su parte', () => {
    const balance = service.computeBalance(
      'g1',
      members,
      [expense('agos', 24600, [['agos', 8200], ['tomi', 8200], ['fede', 8200]], 'Súper Coto')],
      [],
    );

    const agos = balance.members.find((m) => m.memberId === 'agos');
    expect(agos?.net).toBe(16400);
    expect(balance.pairs).toContainEqual(
      expect.objectContaining({ fromMemberId: 'fede', toMemberId: 'agos', amount: 8200 }),
    );
    expect(balance.settled).toBe(false);
  });

  it('cada deuda par a par lista los gastos que la componen (transparencia radical)', () => {
    const balance = service.computeBalance(
      'g1',
      members,
      [
        expense('agos', 24600, [['agos', 8200], ['tomi', 8200], ['fede', 8200]], 'Súper Coto'),
        expense('agos', 6200, [['agos', 5900], ['fede', 300]], 'Ferretería'),
      ],
      [],
    );

    const fedePair = balance.pairs.find(
      (p) => p.fromMemberId === 'fede' && p.toMemberId === 'agos',
    );
    expect(fedePair?.amount).toBe(8500);
    expect(fedePair?.items.map((i) => i.description).sort()).toEqual(['Ferretería', 'Súper Coto']);
    // El total del par es exactamente la suma de sus ítems: el número siempre se explica
    const itemsSum = fedePair?.items.reduce((acc, i) => acc + i.amount, 0);
    expect(itemsSum).toBe(fedePair?.amount);
  });

  it('las deudas en ambos sentidos se netean', () => {
    const balance = service.computeBalance(
      'g1',
      members,
      [
        expense('agos', 300, [['tomi', 300]], 'Café'),
        expense('tomi', 1000, [['agos', 1000]], 'Pizza'),
      ],
      [],
    );
    expect(balance.pairs).toEqual([
      expect.objectContaining({ fromMemberId: 'agos', toMemberId: 'tomi', amount: 700 }),
    ]);
  });

  it('los pagos registrados reducen la deuda y pueden dejar el grupo a mano', () => {
    const balance = service.computeBalance(
      'g1',
      members,
      [expense('tomi', 390000, [['agos', 130000], ['tomi', 130000], ['fede', 130000]], 'Alquiler')],
      [settlement('agos', 'tomi', 130000), settlement('fede', 'tomi', 130000)],
    );
    expect(balance.pairs).toEqual([]);
    expect(balance.transfers).toEqual([]);
    expect(balance.settled).toBe(true);
  });

  it('reproduce el estado del prototipo: Fede te pasa $8.500, vos le pasás $3.900 a Tomi', () => {
    const balance = service.computeBalance(
      'g1',
      members,
      [
        expense('tomi', 390000, [['agos', 130000], ['tomi', 130000], ['fede', 130000]], 'Alquiler julio'),
        expense('tomi', 11700, [['agos', 3900], ['tomi', 3900], ['fede', 3900]], 'Internet Fibertel'),
        expense('agos', 24600, [['agos', 16400], ['fede', 8200]], 'Súper Coto'),
        expense('agos', 6200, [['agos', 5900], ['fede', 300]], 'Ferretería'),
      ],
      [settlement('agos', 'tomi', 130000), settlement('fede', 'tomi', 130000)],
    );

    expect(balance.pairs).toContainEqual(
      expect.objectContaining({ fromMemberId: 'fede', toMemberId: 'agos', amount: 8500 }),
    );
    expect(balance.pairs).toContainEqual(
      expect.objectContaining({ fromMemberId: 'agos', toMemberId: 'tomi', amount: 3900 }),
    );
    // La suma de netos siempre da cero: nadie pierde plata en el camino
    const totalNet = balance.members.reduce((acc, m) => acc + m.net, 0);
    expect(Math.abs(totalNet)).toBeLessThan(0.01);
  });
});
