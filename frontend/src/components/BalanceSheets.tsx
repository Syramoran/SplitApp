import type { SummaryItem } from '../api/types';
import { money, pastel } from '../lib/format';
import { Ic } from './icons';
import { Sheet } from './ui';

function ItemRow({ item, direction }: { item: SummaryItem; direction: 'owed' | 'owe' }) {
  const isPayment = item.description === 'Pago registrado';
  const suffix =
    direction === 'owed' ? `parte de ${item.counterpartyName}` : `${item.counterpartyName} · tu parte`;
  return (
    <div className="row">
      <div className="flex items-center gap-3">
        <span className="cat-dot pastel" style={pastel(item.categoryColor)}>
          <Ic name={item.categoryIcon ?? (isPayment ? 'transfer' : 'coin')} />
        </span>
        <div>
          <p className="row-t">{item.description}</p>
          <p className="row-s">
            {item.groupName} · {suffix}
          </p>
        </div>
      </div>
      <p className="amt">{item.amount < 0 ? `− ${money(-item.amount)}` : money(item.amount)}</p>
    </div>
  );
}

/**
 * Sheets de transparencia radical: cada total del home se explica
 * con los gastos que lo componen (principio de diseño 2).
 */
export function BalanceDetailSheet({
  open,
  onClose,
  direction,
  total,
  items,
}: {
  open: boolean;
  onClose: () => void;
  direction: 'owed' | 'owe';
  total: number;
  items: SummaryItem[];
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      {direction === 'owed' ? (
        <span className="tag sticker pastel" style={pastel('lime')}>
          <Ic name="coin" /> te deben
        </span>
      ) : (
        <span className="tag sticker pastel" style={pastel('peach')}>
          te toca poner
        </span>
      )}
      <p className="my-2.5 text-[34px] font-extrabold">{money(total)}</p>
      {items.length === 0 ? (
        <p className="row-s">Nada pendiente por acá ✳</p>
      ) : (
        items.map((item, index) => <ItemRow key={index} item={item} direction={direction} />)
      )}
      <p className="mt-3 text-[11px] font-bold text-gray1">
        ✦ Cada balance se explica solo: estos son los gastos que lo componen.
      </p>
    </Sheet>
  );
}
