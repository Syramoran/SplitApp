import { Injectable } from '@nestjs/common';
import { round2 } from '../common/numeric.transformer';

export interface MemberNet {
  memberId: string;
  /** Positivo = le deben (puso de más). Negativo = le toca poner. */
  net: number;
}

export interface Transfer {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

const EPSILON = 0.01;

/**
 * Algoritmo de cierre de cuentas: dado el neto de cada miembro,
 * calcula la menor cantidad de transferencias para dejar el grupo a mano
 * ("2 transferencias en vez de 5").
 *
 * Estrategia greedy: se empareja al mayor deudor con el mayor acreedor
 * hasta agotar los saldos. Garantiza como máximo (n - 1) transferencias.
 */
@Injectable()
export class SimplifyService {
  simplify(balances: MemberNet[]): Transfer[] {
    const creditors = balances
      .filter((b) => b.net > EPSILON)
      .map((b) => ({ memberId: b.memberId, remaining: b.net }))
      .sort((a, b) => b.remaining - a.remaining);
    const debtors = balances
      .filter((b) => b.net < -EPSILON)
      .map((b) => ({ memberId: b.memberId, remaining: -b.net }))
      .sort((a, b) => b.remaining - a.remaining);

    const transfers: Transfer[] = [];
    let d = 0;
    let c = 0;
    while (d < debtors.length && c < creditors.length) {
      const amount = Math.min(debtors[d].remaining, creditors[c].remaining);
      transfers.push({
        fromMemberId: debtors[d].memberId,
        toMemberId: creditors[c].memberId,
        amount: round2(amount),
      });
      debtors[d].remaining = round2(debtors[d].remaining - amount);
      creditors[c].remaining = round2(creditors[c].remaining - amount);
      if (debtors[d].remaining <= EPSILON) d++;
      if (creditors[c].remaining <= EPSILON) c++;
    }
    return transfers;
  }
}
