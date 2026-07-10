import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExpenses, useGroup, useGroupBalance, useMe, useSendReminder } from '../api/hooks';
import type { PairBalance } from '../api/types';
import { ExpenseRow } from '../components/ExpenseRow';
import { Ic } from '../components/icons';
import { Avatar, AvatarStack, CardSkeleton, ErrorState, RowSkeleton, Sheet } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money, pastel, shortDate } from '../lib/format';

const GROUP_TYPE_META: Record<string, { icon: string; label: string }> = {
  convivencia: { icon: 'home', label: 'Convivencia' },
  pareja: { icon: 'heart', label: 'Pareja' },
  viaje: { icon: 'plane', label: 'Viaje' },
  evento: { icon: 'burst', label: 'Evento' },
};

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const group = useGroup(id);
  const balance = useGroupBalance(id);
  const expenses = useExpenses({ groupId: id, limit: 30 });
  const sendReminder = useSendReminder();

  const [remindOpen, setRemindOpen] = useState(false);
  const [detailPair, setDetailPair] = useState<PairBalance | null>(null);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

  const memberName = (memberId: string): string => {
    const member = balance.data?.members.find((m) => m.memberId === memberId);
    if (!member) return '—';
    return member.userId === me.data?.id ? 'vos' : member.displayName;
  };
  const memberColor = (memberId: string): string =>
    balance.data?.members.find((m) => m.memberId === memberId)?.avatarColor ?? 'lilac';

  const myMemberId = balance.data?.members.find((m) => m.userId === me.data?.id)?.memberId;

  /** Deudas hacia mí, para el sheet de recordatorios. */
  const owedToMePairs = useMemo(
    () => balance.data?.pairs.filter((pair) => pair.toMemberId === myMemberId) ?? [],
    [balance.data, myMemberId],
  );

  const grossPairCount = balance.data?.pairs.length ?? 0;
  const transferCount = balance.data?.transfers.length ?? 0;
  const meta = group.data ? GROUP_TYPE_META[group.data.type] : null;

  const remind = async (toMemberId: string) => {
    if (!id) return;
    try {
      await sendReminder.mutateAsync({ groupId: id, toMemberId });
      setRemindedIds((current) => new Set(current).add(toMemberId));
      setTimeout(() => {
        setRemindOpen(false);
        toast(`${memberName(toMemberId)} va a recibir una notificación de la app`);
      }, 900);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No pudimos enviar el recordatorio ✕');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pt-3.5">
        <button className="back" onClick={() => navigate('/')}>
          ← Inicio
        </button>
        <button
          className="circle-btn pastel"
          style={pastel('butter')}
          onClick={() => setRemindOpen(true)}
          aria-label="Recordatorios"
        >
          <Ic name="clock" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 scroll-hide">
        {group.isPending ? (
          <div className="mt-4 flex flex-col gap-3">
            <CardSkeleton height={90} />
            <CardSkeleton height={160} />
          </div>
        ) : group.isError ? (
          <div className="mt-4">
            <ErrorState onRetry={() => group.refetch()} />
          </div>
        ) : (
          <>
            <div className="mt-1.5 flex items-end justify-between">
              <div>
                <span className="tag sticker pastel" style={pastel(group.data.color)}>
                  {meta && <Ic name={meta.icon} />} {meta?.label}
                  {group.data.type === 'viaje' && ` · ${group.data.currency}`}
                </span>
                <h1 className="h1 mt-2.5">{group.data.name}</h1>
              </div>
              <AvatarStack members={group.data.members} />
            </div>

            {/* para quedar a mano */}
            {balance.isPending ? (
              <div className="mt-4">
                <CardSkeleton height={140} />
              </div>
            ) : balance.isError ? (
              <div className="mt-4">
                <ErrorState onRetry={() => balance.refetch()} />
              </div>
            ) : (
              <div className="card mt-4" style={{ background: 'var(--surface)' }}>
                <p className="label">Para quedar a mano ✳</p>
                {balance.data.settled ? (
                  <p className="mt-3 text-sm font-bold">
                    Nadie debe nada ✦ el grupo está en cero.
                  </p>
                ) : (
                  <>
                    {balance.data.pairs.map((pair) => {
                      const involvesMe =
                        pair.fromMemberId === myMemberId || pair.toMemberId === myMemberId;
                      const label =
                        pair.toMemberId === myMemberId
                          ? `${memberName(pair.fromMemberId)} te pasa a vos`
                          : pair.fromMemberId === myMemberId
                            ? `Vos le pasás a ${memberName(pair.toMemberId)}`
                            : `${memberName(pair.fromMemberId)} le pasa a ${memberName(pair.toMemberId)}`;
                      return (
                        <button
                          key={`${pair.fromMemberId}-${pair.toMemberId}`}
                          className="row w-full text-left"
                          onClick={() => setDetailPair(pair)}
                        >
                          <p className="flex items-center gap-1.5 text-sm font-bold">
                            <Avatar
                              name={memberName(pair.fromMemberId)}
                              color={memberColor(pair.fromMemberId)}
                              size={26}
                            />{' '}
                            {label}
                          </p>
                          <span
                            className="tag pastel font-extrabold"
                            style={pastel(pair.toMemberId === myMemberId && involvesMe ? 'lime' : 'peach')}
                          >
                            {money(pair.amount)} →
                          </span>
                        </button>
                      );
                    })}
                    <p className="mt-2 text-[11px] font-bold text-gray1">
                      {transferCount} transferencia{transferCount === 1 ? '' : 's'} en vez de{' '}
                      {Math.max(grossPairCount, transferCount)} ✦ simplificamos las deudas cruzadas.
                      Tocá un monto para ver el detalle.
                    </p>
                  </>
                )}
              </div>
            )}

            {!balance.data?.settled && (
              <button className="btn btn-ink mt-3" onClick={() => navigate(`/groups/${id}/settle`)}>
                Cerrar cuentas ✳
              </button>
            )}

            <h2 className="h2 mb-1 mt-5">Movimientos</h2>
            {expenses.isPending ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : expenses.isError ? (
              <ErrorState onRetry={() => expenses.refetch()} />
            ) : expenses.data.length === 0 ? (
              <p className="row-s py-3">
                Sin movimientos todavía — cargá el primero con el botón + del inicio ✳
              </p>
            ) : (
              expenses.data.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} myUserId={me.data?.id} />
              ))
            )}
            <div style={{ height: 30 }} />
          </>
        )}
      </div>

      {/* sheet: detalle de una deuda par a par */}
      <Sheet open={detailPair != null} onClose={() => setDetailPair(null)}>
        {detailPair && (
          <>
            <span className="tag sticker pastel" style={pastel('lime')}>
              <Ic name="coin" /> de dónde sale
            </span>
            <p className="mb-0.5 mt-2.5 text-[15px] font-bold">
              {memberName(detailPair.fromMemberId)} → {memberName(detailPair.toMemberId)}
            </p>
            <p className="mb-2 text-[34px] font-extrabold">{money(detailPair.amount)}</p>
            {detailPair.items.map((item, index) => (
              <div className="row" key={index}>
                <div className="flex items-center gap-3">
                  <span className="cat-dot pastel" style={pastel(item.categoryColor)}>
                    <Ic name={item.categoryIcon ?? (item.kind === 'settlement' ? 'transfer' : 'coin')} />
                  </span>
                  <div>
                    <p className="row-t">{item.description}</p>
                    <p className="row-s">{shortDate(item.date)}</p>
                  </div>
                </div>
                <p className="amt">
                  {item.amount < 0 ? `− ${money(-item.amount)}` : money(item.amount)}
                </p>
              </div>
            ))}
            <p className="mt-3 text-[11px] font-bold text-gray1">
              ✦ Cada balance se explica solo: estos son los gastos que lo componen.
            </p>
          </>
        )}
      </Sheet>

      {/* sheet: recordatorios */}
      <Sheet open={remindOpen} onClose={() => setRemindOpen(false)}>
        <span className="tag sticker pastel" style={pastel('butter')}>
          <Ic name="clock" /> recordatorios
        </span>
        <h2 className="h2 mb-3 mt-2.5 text-2xl">
          Que recuerde la app,
          <br />
          no vos
        </h2>
        {owedToMePairs.length === 0 ? (
          <p className="row-s">Nadie tiene saldos pendientes con vos en este grupo ✳</p>
        ) : (
          owedToMePairs.map((pair) => (
            <div
              key={pair.fromMemberId}
              className="card mb-2.5"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--edge)' }}
            >
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={memberName(pair.fromMemberId)}
                  color={memberColor(pair.fromMemberId)}
                  size={40}
                />
                <div>
                  <p className="text-[15px] font-extrabold">{memberName(pair.fromMemberId)}</p>
                  <p className="text-xs font-semibold text-gray1">{money(pair.amount)} pendientes</p>
                </div>
              </div>
              <button
                className={`btn mt-3.5 p-3 ${remindedIds.has(pair.fromMemberId) ? 'btn-done' : 'btn-ink'}`}
                disabled={remindedIds.has(pair.fromMemberId) || sendReminder.isPending}
                onClick={() => remind(pair.fromMemberId)}
              >
                {remindedIds.has(pair.fromMemberId) ? (
                  'Recordatorio enviado ✳'
                ) : (
                  <>
                    Enviar recordatorio <Ic name="clock" />
                  </>
                )}
              </button>
              <p className="mt-2.5 text-[11px] font-bold text-gray1">
                Le llega una notificación neutral de la app. Vos no mandás nada — el mensaje
                incómodo lo ponemos nosotros ✦
              </p>
            </div>
          ))
        )}
      </Sheet>
    </div>
  );
}
