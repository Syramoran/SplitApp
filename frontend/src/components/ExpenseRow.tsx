import type { Expense } from '../api/types';
import { money, pastel, shortDate } from '../lib/format';
import { Ic } from './icons';

/** Fila de movimiento: ícono de categoría, descripción, contexto y monto. */
export function ExpenseRow({ expense, myUserId }: { expense: Expense; myUserId?: string }) {
  const payer = expense.paidByMember
    ? expense.paidByMember.userId === myUserId
      ? 'pagaste vos'
      : `pagó ${expense.paidByMember.displayName}`
    : null;

  const context = [
    shortDate(expense.date),
    expense.group ? expense.group.name : 'Personal',
    payer,
    expense.splitType === 'equal' && expense.splits ? `÷${expense.splits.length}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="row">
      <div className="flex items-center gap-3">
        <span className="cat-dot pastel" style={pastel(expense.category?.color)}>
          <Ic name={expense.category?.icon ?? 'coin'} />
        </span>
        <div>
          <p className="row-t">{expense.description}</p>
          <p className="row-s">
            {context}
            {expense.isRecurring && (
              <>
                {' · '}
                <Ic name="repeat" /> recurrente
              </>
            )}
          </p>
        </div>
      </div>
      <p className="amt">{money(expense.amount)}</p>
    </div>
  );
}
