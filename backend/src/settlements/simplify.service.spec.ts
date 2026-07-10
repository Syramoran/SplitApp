import { SimplifyService } from './simplify.service';

describe('SimplifyService (algoritmo de cierre de cuentas)', () => {
  let service: SimplifyService;

  beforeEach(() => {
    service = new SimplifyService();
  });

  it('devuelve vacío cuando el grupo ya está a mano', () => {
    expect(service.simplify([])).toEqual([]);
    expect(
      service.simplify([
        { memberId: 'a', net: 0 },
        { memberId: 'b', net: 0 },
      ]),
    ).toEqual([]);
  });

  it('resuelve una deuda simple entre dos personas', () => {
    const transfers = service.simplify([
      { memberId: 'agos', net: 8500 },
      { memberId: 'fede', net: -8500 },
    ]);
    expect(transfers).toEqual([{ fromMemberId: 'fede', toMemberId: 'agos', amount: 8500 }]);
  });

  it('simplifica deudas cruzadas: A→B→C se vuelve una sola transferencia', () => {
    // A le debe 100 a B y B le debe 100 a C ⇒ neto: A -100, B 0, C +100
    const transfers = service.simplify([
      { memberId: 'a', net: -100 },
      { memberId: 'b', net: 0 },
      { memberId: 'c', net: 100 },
    ]);
    expect(transfers).toEqual([{ fromMemberId: 'a', toMemberId: 'c', amount: 100 }]);
  });

  it('nunca genera más de n-1 transferencias', () => {
    const balances = [
      { memberId: 'a', net: 500 },
      { memberId: 'b', net: 300 },
      { memberId: 'c', net: -200 },
      { memberId: 'd', net: -350 },
      { memberId: 'e', net: -250 },
    ];
    const transfers = service.simplify(balances);
    expect(transfers.length).toBeLessThanOrEqual(balances.length - 1);
  });

  it('las transferencias saldan exactamente los netos de cada miembro', () => {
    const balances = [
      { memberId: 'agos', net: 4600 },
      { memberId: 'tomi', net: 7800 },
      { memberId: 'fede', net: -12400 },
    ];
    const transfers = service.simplify(balances);

    const settled = new Map(balances.map((b) => [b.memberId, b.net]));
    for (const t of transfers) {
      settled.set(t.fromMemberId, (settled.get(t.fromMemberId) ?? 0) + t.amount);
      settled.set(t.toMemberId, (settled.get(t.toMemberId) ?? 0) - t.amount);
    }
    for (const remaining of settled.values()) {
      expect(Math.abs(remaining)).toBeLessThan(0.01);
    }
  });

  it('tolera restos de centavos por redondeo', () => {
    const transfers = service.simplify([
      { memberId: 'a', net: 33.33 },
      { memberId: 'b', net: 33.33 },
      { memberId: 'c', net: -66.67 },
    ]);
    const total = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(Math.abs(total - 66.66)).toBeLessThan(0.02);
  });
});
