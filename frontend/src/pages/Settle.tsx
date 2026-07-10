import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateSettlement, useGroup, useGroupBalance, useMe } from '../api/hooks';
import type { SettlementMethod, Transfer } from '../api/types';
import { Ic } from '../components/icons';
import { Avatar, CardSkeleton, ErrorState } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money, pastel } from '../lib/format';

const CARD_COLORS = ['blue', 'butter', 'peach', 'mint'];
const METHODS: Array<{ value: SettlementMethod; label: string; icon: string | null }> = [
  { value: 'transfer', label: 'Transfe', icon: 'transfer' },
  { value: 'cash', label: 'Efectivo', icon: 'cash' },
  { value: 'other', label: 'Otro', icon: null },
];

interface DoneTransfer extends Transfer {
  fromName: string;
  toName: string;
}

export function Settle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const group = useGroup(id);
  const balance = useGroupBalance(id);
  const createSettlement = useCreateSettlement();

  const [methods, setMethods] = useState<Record<number, SettlementMethod>>({});
  const [paid, setPaid] = useState<DoneTransfer[]>([]);

  const memberName = (memberId: string): string => {
    const member = balance.data?.members.find((m) => m.memberId === memberId);
    if (!member) return '—';
    return member.userId === me.data?.id ? 'vos' : member.displayName;
  };
  const memberColor = (memberId: string): string =>
    balance.data?.members.find((m) => m.memberId === memberId)?.avatarColor ?? 'lilac';

  const transfers = balance.data?.transfers ?? [];
  const isPaid = (transfer: Transfer) =>
    paid.some((p) => p.fromMemberId === transfer.fromMemberId && p.toMemberId === transfer.toMemberId);

  const markPaid = async (transfer: Transfer, index: number) => {
    if (!id || isPaid(transfer)) return;
    try {
      await createSettlement.mutateAsync({
        groupId: id,
        fromMemberId: transfer.fromMemberId,
        toMemberId: transfer.toMemberId,
        amount: transfer.amount,
        method: methods[index] ?? 'transfer',
      });
      const done = [
        ...paid,
        {
          ...transfer,
          fromName: memberName(transfer.fromMemberId),
          toName: memberName(transfer.toMemberId),
        },
      ];
      setPaid(done);
      if (done.length >= transfers.length) {
        setTimeout(() => {
          navigate(`/groups/${id}/done`, {
            state: { transfers: done, groupName: group.data?.name ?? '' },
          });
        }, 600);
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No pudimos registrar el pago ✕');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-3.5">
        <button className="back" onClick={() => navigate(`/groups/${id}`)}>
          ← {group.data?.name ?? 'Grupo'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 scroll-hide">
        <span className="tag sticker pastel mt-2 inline-block" style={pastel('lime')}>
          ✳ cerrar cuentas
        </span>
        <h1 className="h1 mt-2.5">
          {transfers.length === 1 ? 'Un pase' : `${transfers.length === 2 ? 'Dos pases' : `${transfers.length} pases`}`}
          <br />y a mano
        </h1>
        <p className="mt-2 text-[13px] font-semibold text-gray2">
          Calculamos la menor cantidad de transferencias posible.
        </p>

        {balance.isPending ? (
          <div className="mt-4 flex flex-col gap-2.5">
            <CardSkeleton height={150} />
            <CardSkeleton height={150} />
          </div>
        ) : balance.isError ? (
          <div className="mt-4">
            <ErrorState onRetry={() => balance.refetch()} />
          </div>
        ) : transfers.length === 0 ? (
          <div className="card mt-4 text-center" style={{ background: 'var(--surface)' }}>
            <p className="text-sm font-bold">El grupo ya está a mano ✳</p>
          </div>
        ) : (
          transfers.map((transfer, index) => {
            const done = isPaid(transfer);
            const receiving =
              balance.data.members.find((m) => m.memberId === transfer.toMemberId)?.userId ===
              me.data?.id;
            return (
              <div
                key={`${transfer.fromMemberId}-${transfer.toMemberId}`}
                className={`card pastel ${index === 0 ? 'mt-4' : 'mt-2.5'}`}
                style={pastel(CARD_COLORS[index % CARD_COLORS.length])}
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <Avatar
                      name={memberName(transfer.fromMemberId)}
                      color={memberColor(transfer.fromMemberId)}
                      size={28}
                    />{' '}
                    {memberName(transfer.fromMemberId)} → {memberName(transfer.toMemberId)}
                  </p>
                  <p className="text-[22px] font-extrabold">{money(transfer.amount)}</p>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {METHODS.map((method) => (
                    <button
                      key={method.value}
                      className={`chip ${(methods[index] ?? 'transfer') === method.value ? 'chip-on' : ''}`}
                      onClick={() => setMethods((current) => ({ ...current, [index]: method.value }))}
                      disabled={done}
                    >
                      {method.icon && <Ic name={method.icon} />} {method.label}
                    </button>
                  ))}
                </div>
                <button
                  className={`btn mt-3 p-3 ${done ? 'btn-done' : 'btn-surface'}`}
                  onClick={() => markPaid(transfer, index)}
                  disabled={done || createSettlement.isPending}
                >
                  {done ? 'Registrado ✳' : receiving ? 'Marcar como recibido' : 'Marcar como pagado'}
                </button>
              </div>
            );
          })
        )}
        <p className="mt-3 text-[11px] font-bold text-gray1">
          El pago real lo hacés por donde siempre — acá solo queda registrado ✦
        </p>
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
